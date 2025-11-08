/**
 * Access Validation Service
 *
 * Handles checking user access to paid tiers and determining active access periods
 */

import { db } from '../db';
import { userAccessPeriods } from '../schema';
import { and, eq, gt, lte } from 'drizzle-orm';
import type { TierId } from '../stripe-config';

/**
 * Check if a user has active access to a specific tier
 */
export async function hasActiveTierAccess(
  userId: string,
  tierId: TierId
): Promise<boolean> {
  // Free tier is always accessible
  if (tierId === '1hour') {
    return true;
  }

  const now = new Date();

  // Check for active access period
  const activePeriod = await db.query.userAccessPeriods.findFirst({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.tierId, tierId),
      eq(userAccessPeriods.status, 'active'),
      lte(userAccessPeriods.startsAt, now),
      gt(userAccessPeriods.expiresAt, now)
    ),
  });

  return !!activePeriod;
}

/**
 * Get all active tiers for a user
 */
export async function getUserActiveTiers(userId: string): Promise<TierId[]> {
  const now = new Date();

  // Free tier is always active
  const activeTiers: TierId[] = ['1hour'];

  // Get all active paid tiers
  const activePeriodsRaw = await db.query.userAccessPeriods.findMany({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.status, 'active'),
      lte(userAccessPeriods.startsAt, now),
      gt(userAccessPeriods.expiresAt, now)
    ),
    with: {
      tier: true,
    },
  });

  // Add active paid tiers
  for (const period of activePeriodsRaw) {
    const tierId = period.tierId as TierId;
    if (tierId !== '1hour' && !activeTiers.includes(tierId)) {
      activeTiers.push(tierId);
    }
  }

  return activeTiers;
}

/**
 * Get the fastest tier a user has access to
 * Used for batch optimization in cron jobs
 */
export async function getFastestActiveTier(userId: string): Promise<TierId> {
  const activeTiers = await getUserActiveTiers(userId);

  // Priority order: 15min > 30min > 1hour
  if (activeTiers.includes('15min')) {
    return '15min';
  }
  if (activeTiers.includes('30min')) {
    return '30min';
  }
  return '1hour';
}

/**
 * Get active access period for a specific tier
 */
export async function getActivePeriod(userId: string, tierId: TierId) {
  const now = new Date();

  return await db.query.userAccessPeriods.findFirst({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.tierId, tierId),
      eq(userAccessPeriods.status, 'active'),
      lte(userAccessPeriods.startsAt, now),
      gt(userAccessPeriods.expiresAt, now)
    ),
  });
}

/**
 * Get all active access periods for a user
 */
export async function getAllActivePeriodsForUser(userId: string) {
  const now = new Date();

  return await db.query.userAccessPeriods.findMany({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.status, 'active'),
      lte(userAccessPeriods.startsAt, now),
      gt(userAccessPeriods.expiresAt, now)
    ),
    with: {
      tier: true,
    },
    orderBy: (periods, { desc }) => [desc(periods.expiresAt)],
  });
}

/**
 * Validate that a user can use a specific tier for an alert
 */
export async function canUseTierForAlert(
  userId: string,
  tierId: TierId
): Promise<{ canUse: boolean; reason?: string; expiresAt?: Date }> {
  // Free tier is always usable
  if (tierId === '1hour') {
    return {
      canUse: true,
      reason: 'Free tier always available'
    };
  }

  const activePeriod = await getActivePeriod(userId, tierId);

  if (!activePeriod) {
    return {
      canUse: false,
      reason: 'No active access period',
    };
  }

  return {
    canUse: true,
    reason: 'Active access period found',
    expiresAt: activePeriod.expiresAt
  };
}
