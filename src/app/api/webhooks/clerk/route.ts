import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { UserModel } from '@/lib/models/user.model';
import { Role } from '@/lib/enums';
import { connectDB } from '@/lib/db/connect';
import { logger } from '@/lib/utils/logger';

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      verification: {
        status: string;
      };
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    phone_numbers: Array<{
      phone_number: string;
      verification: {
        status: string;
      };
    }>;
    unsafe_metadata: Record<string, unknown>;
    public_metadata: Record<string, unknown>;
    private_metadata: Record<string, unknown>;
    created_at: number;
    updated_at: number;
    last_sign_in_at: number | null;
    birthday: string | null;
    gender: string | null;
  };
};

export async function POST(req: NextRequest) {
  logger.info('Webhook received');

  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  logger.info('Webhook headers:', {
    svix_id,
    svix_timestamp,
    has_signature: !!svix_signature
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.error('Missing svix headers');
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  logger.info('Webhook payload length:', payload.length);

  // Check if webhook secret is configured
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET is not configured');
    return new NextResponse('Webhook secret not configured', {
      status: 500
    });
  }

  // Create a new Svix instance with your webhook secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as ClerkWebhookEvent;
    logger.info('Webhook verified successfully, type:', evt.type);
  } catch (err) {
    logger.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred - invalid signature', {
      status: 400
    });
  }

  // Handle the webhook
  const { type, data } = evt;

  try {
    logger.info('Connecting to database...');
    await connectDB();
    logger.info('Database connected successfully');

    switch (type) {
      case 'user.created':
        logger.info('Handling user.created event for:', data.id);
        await handleUserCreated(data);
        break;
      case 'user.updated':
        logger.info('Handling user.updated event for:', data.id);
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        logger.info('Handling user.deleted event for:', data.id);
        await handleUserDeleted(data);
        break;
      default:
        logger.info(`Unhandled webhook type: ${type}`);
    }

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    return new NextResponse('Error occurred', { status: 500 });
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  logger.info('handleUserCreated called with data:', {
    id: data.id,
    email_count: data.email_addresses.length,
    first_name: data.first_name,
    last_name: data.last_name
  });

  const primaryEmail =
    data.email_addresses.find(
      (email) => email.verification.status === 'verified'
    ) || data.email_addresses[0];

  if (!primaryEmail) {
    logger.error('No email address found for user:', data.id);
    throw new Error('No email address found');
  }

  const primaryPhone =
    data.phone_numbers.find(
      (phone) => phone.verification.status === 'verified'
    ) || data.phone_numbers[0];

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');

  logger.info('Creating user with email:', primaryEmail.email_address);

  try {
    const newUser = await UserModel.create({
      clerkId: data.id,
      email: primaryEmail.email_address,
      role: Role.STUDENT, // Default role
      name: fullName || undefined,
      profile: {
        firstName: data.first_name || undefined,
        lastName: data.last_name || undefined,
        fullName: fullName || undefined,
        imageUrl: data.image_url || undefined,
        phoneNumber: primaryPhone?.phone_number || undefined,
        birthday: data.birthday || undefined,
        gender: data.gender || undefined
      },
      lastSignInAt: data.last_sign_in_at
        ? new Date(data.last_sign_in_at)
        : undefined,
      emailVerified: primaryEmail.verification.status === 'verified',
      phoneVerified: primaryPhone?.verification.status === 'verified' || false,
      isActive: true
    });

    logger.info('User created successfully:', {
      clerkId: newUser.clerkId,
      email: newUser.email,
      _id: newUser._id
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail =
    data.email_addresses.find(
      (email) => email.verification.status === 'verified'
    ) || data.email_addresses[0];

  const primaryPhone =
    data.phone_numbers.find(
      (phone) => phone.verification.status === 'verified'
    ) || data.phone_numbers[0];

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { clerkId: data.id },
      {
        email: primaryEmail.email_address,
        name: fullName || undefined,
        profile: {
          firstName: data.first_name || undefined,
          lastName: data.last_name || undefined,
          fullName: fullName || undefined,
          imageUrl: data.image_url || undefined,
          phoneNumber: primaryPhone?.phone_number || undefined,
          birthday: data.birthday || undefined,
          gender: data.gender || undefined
        },
        lastSignInAt: data.last_sign_in_at
          ? new Date(data.last_sign_in_at)
          : undefined,
        emailVerified: primaryEmail.verification.status === 'verified',
        phoneVerified:
          primaryPhone?.verification.status === 'verified' || false,
        updatedAt: new Date()
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      logger.info('User not found for update, creating new user');
      await handleUserCreated(data);
    } else {
      logger.info('User updated successfully:', updatedUser.clerkId);
    }
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    const deletedUser = await UserModel.findOneAndUpdate(
      { clerkId: data.id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (deletedUser) {
      logger.info('User marked as inactive:', deletedUser.clerkId);
    } else {
      logger.info('User not found for deletion:', data.id);
    }
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
}
