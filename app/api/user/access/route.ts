/**
 * User Access API Route
 *
 * Returns user's active subscription tiers and expiry dates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllActivePeriodsForUser } from '@/lib/services/access-validation.service';
import { TIER_CONFIG } from '@/lib/stripe-config';

// ============================================================================
// GET /api/user/access - Get user's active subscriptions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active access periods
    const activePeriods = await getAllActivePeriodsForUser(userId);

    // Always include free tier
    const subscriptions: Array<{
      tierId: string;
      name: string;
      interval: string;
      expiresAt: string | null;
      daysRemaining: number | null;
    }> = [
      {
        tierId: '1hour',
        name: TIER_CONFIG['1hour'].name,
        interval: TIER_CONFIG['1hour'].interval,
        expiresAt: null, // Free tier never expires
        daysRemaining: null,
      },
    ];

    // Add paid tiers with expiry info
    for (const period of activePeriods) {
      const tierConfig = TIER_CONFIG[period.tierId as keyof typeof TIER_CONFIG];
      if (!tierConfig) continue;

      const now = new Date();
      const expiresAt = period.expiresAt;
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      subscriptions.push({
        tierId: period.tierId,
        name: tierConfig.name,
        interval: tierConfig.interval,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
      });
    }

    return NextResponse.json({ subscriptions });

  } catch (error) {
    console.error('Error fetching user access:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user access' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
