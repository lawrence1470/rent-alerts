/**
 * User Sync API Route
 *
 * Syncs the current authenticated user from Clerk to the local database.
 * Used for local development where Clerk webhooks can't reach localhost.
 *
 * POST /api/users/sync - Sync current user to local database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full user data from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Could not fetch user data from Clerk' },
        { status: 500 }
      );
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );
    const email = primaryEmail?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 400 }
      );
    }

    // Get primary phone (optional)
    const primaryPhone = clerkUser.phoneNumbers.find(
      (phone) => phone.id === clerkUser.primaryPhoneNumberId
    );
    const phoneNumber = primaryPhone?.phoneNumber;

    // Upsert user data
    const [syncedUser] = await db
      .insert(users)
      .values({
        id: userId,
        email,
        phoneNumber: phoneNumber || null,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          phoneNumber: phoneNumber || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`User synced: ${userId} (${email})`);

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: syncedUser.id,
        email: syncedUser.email,
        phoneNumber: syncedUser.phoneNumber,
        firstName: syncedUser.firstName,
        lastName: syncedUser.lastName,
      },
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
