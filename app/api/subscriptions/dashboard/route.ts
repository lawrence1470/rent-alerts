/**
 * Subscriptions Dashboard API Route
 *
 * Aggregates all subscription-related data for the dashboard in a single request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts, notifications, purchases, userAccessPeriods } from '@/lib/schema';
import { eq, and, desc, count, gte } from 'drizzle-orm';
import { getAllActivePeriodsForUser } from '@/lib/services/access-validation.service';
import { TIER_CONFIG, type TierId } from '@/lib/stripe-config';

// ============================================================================
// GET /api/subscriptions/dashboard - Get all subscription dashboard data
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

    // Fetch all data in parallel
    const [
      activePeriods,
      alertsData,
      notificationsCount,
      recentPurchases,
    ] = await Promise.all([
      // Active subscription periods
      getAllActivePeriodsForUser(userId),

      // Active alerts count and notification preferences
      db.query.alerts.findMany({
        where: eq(alerts.userId, userId),
        columns: {
          id: true,
          isActive: true,
          enableEmailNotifications: true,
          enablePhoneNotifications: true,
        },
      }),

      // Notifications sent in last 30 days
      db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.status, 'sent'),
            gte(notifications.sentAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          )
        ),

      // Recent purchases (last 10)
      db.query.purchases.findMany({
        where: eq(purchases.userId, userId),
        orderBy: desc(purchases.createdAt),
        limit: 10,
        with: {
          tier: true,
        },
      }),
    ]);

    // Determine current plan (best active tier)
    let currentPlan: {
      tierId: string;
      tierName: string;
      pricePerWeek: number;
      interval: string;
      checksPerDay: number;
      expiresAt: string | null;
      daysRemaining: number | null;
      percentRemaining: number;
      status: 'active' | 'expiring-soon' | 'expired' | 'free' | 'cancelled';
      accessPeriodId: string | null;
    };

    if (activePeriods.length > 0) {
      // Find the best (fastest) active tier
      const bestPeriod = activePeriods.reduce((best, current) => {
        const bestChecks = TIER_CONFIG[best.tierId as TierId]?.checksPerDay || 0;
        const currentChecks = TIER_CONFIG[current.tierId as TierId]?.checksPerDay || 0;
        return currentChecks > bestChecks ? current : best;
      });

      const tierConfig = TIER_CONFIG[bestPeriod.tierId as TierId];
      const now = new Date();
      const expiresAt = bestPeriod.expiresAt;
      const startsAt = bestPeriod.startsAt;
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.ceil((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      const percentRemaining = Math.round((daysRemaining / totalDays) * 100);

      // Determine status based on days remaining
      let status: 'active' | 'expiring-soon' | 'expired' | 'free' | 'cancelled' = 'active';
      if (bestPeriod.status === 'refunded') {
        status = 'cancelled';
      } else if (daysRemaining <= 3) {
        status = 'expiring-soon';
      }

      currentPlan = {
        tierId: bestPeriod.tierId,
        tierName: tierConfig?.name || bestPeriod.tierId,
        pricePerWeek: tierConfig?.pricePerWeek || 0,
        interval: tierConfig?.interval || '1 hour',
        checksPerDay: tierConfig?.checksPerDay || 24,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
        percentRemaining: Math.max(0, Math.min(100, percentRemaining)),
        status,
        accessPeriodId: bestPeriod.id,
      };
    } else {
      // Free tier
      const freeTier = TIER_CONFIG['1hour'];
      currentPlan = {
        tierId: '1hour',
        tierName: freeTier.name,
        pricePerWeek: freeTier.pricePerWeek,
        interval: freeTier.interval,
        checksPerDay: freeTier.checksPerDay,
        expiresAt: null,
        daysRemaining: null,
        percentRemaining: 100,
        status: 'free',
        accessPeriodId: null,
      };
    }

    // Calculate stats
    const activeAlerts = alertsData.filter(a => a.isActive).length;
    const notificationsSent = notificationsCount[0]?.count || 0;

    // Get notification preferences (from most recently updated alert, or defaults)
    const alertWithPrefs = alertsData.length > 0 ? alertsData[0] : null;
    const smsAvailable = currentPlan.tierId === '1hour-sms' ||
                         activePeriods.some(p => p.tierId === '1hour-sms');

    const notificationPrefs = {
      emailEnabled: alertWithPrefs?.enableEmailNotifications ?? true,
      smsEnabled: alertWithPrefs?.enablePhoneNotifications ?? false,
      smsAvailable,
    };

    // Format transactions
    const transactions = recentPurchases.map(purchase => ({
      id: purchase.id,
      date: purchase.createdAt.toISOString(),
      tierName: purchase.tier?.name || TIER_CONFIG[purchase.tierId as TierId]?.name || purchase.tierId,
      weeksPurchased: purchase.weeksPurchased,
      amount: purchase.totalAmount,
      status: purchase.status,
    }));

    return NextResponse.json({
      currentPlan,
      stats: {
        activeAlerts,
        notificationsSent,
      },
      notificationPrefs,
      transactions,
    });

  } catch (error) {
    console.error('Error fetching subscription dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
