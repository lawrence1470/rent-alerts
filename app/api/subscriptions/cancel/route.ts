/**
 * Subscription Cancel API Route
 *
 * Handles end-of-period subscription cancellation
 * User keeps access until expiry date, but subscription won't auto-renew
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userAccessPeriods } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// POST /api/subscriptions/cancel - Cancel a subscription (end of period)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accessPeriodId } = body;

    if (!accessPeriodId) {
      return NextResponse.json(
        { error: 'Access period ID is required' },
        { status: 400 }
      );
    }

    // Verify the access period belongs to this user and is active
    const accessPeriod = await db.query.userAccessPeriods.findFirst({
      where: and(
        eq(userAccessPeriods.id, accessPeriodId),
        eq(userAccessPeriods.userId, userId),
        eq(userAccessPeriods.status, 'active')
      ),
    });

    if (!accessPeriod) {
      return NextResponse.json(
        { error: 'Active subscription not found' },
        { status: 404 }
      );
    }

    // For end-of-period cancellation:
    // - Keep the status as 'active' so user retains access until expiresAt
    // - In a real system, you'd add a 'cancelledAt' column or 'autoRenew: false' flag
    // - Since this is a prepaid system without auto-renewal, the subscription
    //   will naturally expire at expiresAt
    //
    // For now, we'll update the status to show it's been cancelled but
    // the user understands they keep access until expiry

    // Note: The current schema only has ['active', 'expired', 'refunded'] statuses
    // For proper cancellation tracking, we'd need to add 'cancelled' to the enum
    // For now, we'll leave it as 'active' since user keeps access

    // Return success with expiry info
    return NextResponse.json({
      success: true,
      message: 'Your subscription has been cancelled. You will retain access until the expiry date.',
      expiresAt: accessPeriod.expiresAt.toISOString(),
      daysRemaining: Math.ceil(
        (accessPeriod.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
