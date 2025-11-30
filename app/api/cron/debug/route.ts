/**
 * Debug Cron Endpoint
 *
 * Allows manual triggering of alert checks for testing purposes.
 * Only works in development environment.
 *
 * GET /api/cron/debug - Run the cron job manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { checkAllAlerts } from '@/lib/services/cron-job.service';
import { getActiveBatches } from '@/lib/services/alert-batching.service';
import { db } from '@/lib/db';
import { alerts, notifications, users, userSeenListings } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { isEmailEnabled } from '@/lib/services/email.service';
import { isSMSEnabled } from '@/lib/services/sms.service';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 }
      );
    }

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const action = request.nextUrl.searchParams.get('action') || 'status';

    if (action === 'status') {
      // Return system status
      const batches = await getActiveBatches();
      const userAlerts = await db.query.alerts.findMany({
        where: eq(alerts.userId, userId),
      });

      const recentNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: desc(notifications.createdAt),
        limit: 10,
      });

      // Check if user exists in local database
      const localUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      return NextResponse.json({
        success: true,
        status: {
          environment: process.env.NODE_ENV,
          emailEnabled: isEmailEnabled(),
          smsEnabled: isSMSEnabled(),
          firecrawlConfigured: !!process.env.FIRECRAWL_API_KEY,
          resendConfigured: !!process.env.RESEND_API_KEY,
          twilioConfigured: !!(
            process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_PHONE_NUMBER
          ),
        },
        user: {
          clerkId: userId,
          syncedToDb: !!localUser,
          email: localUser?.email || null,
          phoneNumber: localUser?.phoneNumber || null,
          needsSync: !localUser,
          syncUrl: !localUser ? 'POST /api/users/sync' : null,
        },
        batches: {
          total: batches.length,
          details: batches.map(b => ({
            batchId: b.batchId.slice(0, 8),
            areas: b.criteria.areas,
            alertCount: b.alertIds.length,
          })),
        },
        userAlerts: userAlerts.map(a => ({
          id: a.id,
          name: a.name,
          isActive: a.isActive,
          frequency: a.preferredFrequency,
          lastChecked: a.lastChecked,
          emailEnabled: a.enableEmailNotifications,
          smsEnabled: a.enablePhoneNotifications,
        })),
        recentNotifications: recentNotifications.map(n => ({
          id: n.id,
          channel: n.channel,
          status: n.status,
          createdAt: n.createdAt,
          sentAt: n.sentAt,
          errorMessage: n.errorMessage,
        })),
      });
    }

    if (action === 'run') {
      // Run the cron job with force flag to bypass timing checks
      console.log('[DEBUG] Manually triggering cron job (force mode)...');
      const result = await checkAllAlerts(true); // Pass force=true to bypass timing
      console.log('[DEBUG] Cron job result:', result);

      return NextResponse.json({
        success: true,
        message: 'Cron job completed',
        result,
      });
    }

    if (action === 'sync') {
      // Sync user from Clerk to local database
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

      console.log(`[DEBUG] User synced: ${userId} (${email})`);

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
    }

    if (action === 'reset') {
      // Reset seen listings for this user (for testing)
      const deleted = await db.delete(userSeenListings)
        .where(eq(userSeenListings.userId, userId))
        .returning();

      console.log(`[DEBUG] Reset ${deleted.length} seen listings for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: `Reset ${deleted.length} seen listings`,
        deletedCount: deleted.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=status, ?action=run, ?action=sync, or ?action=reset' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
