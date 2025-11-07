import { currentUser } from '@clerk/nextjs/server';
import { UserModel } from '@/lib/models/user.model';
import { Role } from '@/lib/enums';
import { connectDB } from '@/lib/db/connect';
import { logger } from '@/lib/utils/logger';

export async function syncUserToMongoDB() {
  try {
    // Get the current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    // Connect to MongoDB
    await connectDB();

    // Check if user already exists in our database
    let user = await UserModel.findOne({ clerkId: clerkUser.id });

    if (!user) {
      // Create new user if doesn't exist
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (email) => email.verification?.status === 'verified'
        ) || clerkUser.emailAddresses[0];

      const primaryPhone =
        clerkUser.phoneNumbers.find(
          (phone) => phone.verification?.status === 'verified'
        ) || clerkUser.phoneNumbers[0];

      const fullName = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(' ');

      user = await UserModel.create({
        clerkId: clerkUser.id,
        email: primaryEmail.emailAddress,
        role: Role.STUDENT, // Default role
        name: fullName || undefined,
        profile: {
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          fullName: fullName || undefined,
          imageUrl: clerkUser.imageUrl || undefined,
          phoneNumber: primaryPhone?.phoneNumber || undefined,
          birthday: undefined, // Not available in Clerk user object
          gender: undefined // Not available in Clerk user object
        },
        lastSignInAt: clerkUser.lastSignInAt
          ? new Date(clerkUser.lastSignInAt)
          : undefined,
        emailVerified: primaryEmail.verification?.status === 'verified',
        phoneVerified:
          primaryPhone?.verification?.status === 'verified' || false,
        isActive: true
      });

      logger.info('User synchronized to MongoDB:', user.clerkId);
    }

    return user;
  } catch (error) {
    logger.error('Error synchronizing user to MongoDB:', error);
    throw error;
  }
}
