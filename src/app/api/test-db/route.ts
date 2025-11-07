import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { UserModel } from '@/lib/models/user.model';
import { Role } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    // Test database connection
    await connectDB();

    // Count existing users
    const userCount = await UserModel.countDocuments();

    // Get all users
    const users = await UserModel.find().limit(5);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      users: users.map((u) => ({
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    logger.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test creating a user
export async function POST() {
  try {
    await connectDB();

    const testUser = await UserModel.create({
      clerkId: `test_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      role: Role.STUDENT,
      name: 'Test User',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User'
      },
      emailVerified: false,
      phoneVerified: false,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Test user created',
      user: {
        clerkId: testUser.clerkId,
        email: testUser.email,
        name: testUser.name,
        _id: testUser._id
      }
    });
  } catch (error) {
    logger.error('Test user creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
