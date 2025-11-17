/**
 * Alert Statistics Service
 *
 * Provides analytics and statistics for alert runs
 */

import { db } from '../db';
import { alertRuns } from '../schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface AlertRunStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  skippedRuns: number;
  successRate: number;

  // Listing metrics
  avgMatchingListings: number;
  avgNewListings: number;
  avgDuplicateListings: number;
  totalListingsFound: number;
  totalNewListingsFound: number;

  // Notification metrics
  totalNotificationsSent: number;
  avgNotificationsPerRun: number;

  // Performance metrics
  avgExecutionTimeMs: number;
  lastRunAt: Date | null;
  lastSuccessfulRunAt: Date | null;
}

export interface AlertRunTrendData {
  date: string;
  matchingListings: number;
  newListings: number;
  duplicateListings: number;
  notificationsSent: number;
  status: 'success' | 'skipped' | 'failed';
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get recent run history for a specific alert
 */
export async function getAlertRunHistory(alertId: string, limit: number = 50) {
  return db.query.alertRuns.findMany({
    where: eq(alertRuns.alertId, alertId),
    orderBy: [desc(alertRuns.executedAt)],
    limit,
    with: {
      batch: {
        columns: {
          id: true,
          criteriaHash: true,
        }
      }
    }
  });
}

/**
 * Get aggregate statistics for a specific alert
 */
export async function getAlertStats(alertId: string): Promise<AlertRunStats> {
  const runs = await db.query.alertRuns.findMany({
    where: eq(alertRuns.alertId, alertId),
    orderBy: [desc(alertRuns.executedAt)],
  });

  if (runs.length === 0) {
    return {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      skippedRuns: 0,
      successRate: 0,
      avgMatchingListings: 0,
      avgNewListings: 0,
      avgDuplicateListings: 0,
      totalListingsFound: 0,
      totalNewListingsFound: 0,
      totalNotificationsSent: 0,
      avgNotificationsPerRun: 0,
      avgExecutionTimeMs: 0,
      lastRunAt: null,
      lastSuccessfulRunAt: null,
    };
  }

  const successfulRuns = runs.filter(r => r.status === 'success');
  const failedRuns = runs.filter(r => r.status === 'failed');
  const skippedRuns = runs.filter(r => r.status === 'skipped');

  const totalMatchingListings = runs.reduce((sum, r) => sum + r.matchingListings, 0);
  const totalNewListings = runs.reduce((sum, r) => sum + r.newListings, 0);
  const totalDuplicateListings = runs.reduce((sum, r) => sum + r.duplicateListings, 0);
  const totalNotificationsSent = runs.reduce((sum, r) => sum + r.notificationsSent, 0);
  const totalExecutionTime = runs.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0);

  const lastSuccessfulRun = successfulRuns.length > 0 ? successfulRuns[0] : null;

  return {
    totalRuns: runs.length,
    successfulRuns: successfulRuns.length,
    failedRuns: failedRuns.length,
    skippedRuns: skippedRuns.length,
    successRate: runs.length > 0 ? (successfulRuns.length / runs.length) * 100 : 0,

    avgMatchingListings: runs.length > 0 ? totalMatchingListings / runs.length : 0,
    avgNewListings: runs.length > 0 ? totalNewListings / runs.length : 0,
    avgDuplicateListings: runs.length > 0 ? totalDuplicateListings / runs.length : 0,
    totalListingsFound: totalMatchingListings,
    totalNewListingsFound: totalNewListings,

    totalNotificationsSent,
    avgNotificationsPerRun: runs.length > 0 ? totalNotificationsSent / runs.length : 0,

    avgExecutionTimeMs: runs.length > 0 ? totalExecutionTime / runs.length : 0,
    lastRunAt: runs[0].executedAt,
    lastSuccessfulRunAt: lastSuccessfulRun?.executedAt || null,
  };
}

/**
 * Get trend data for charting (last N days)
 */
export async function getAlertRunTrend(
  alertId: string,
  days: number = 7
): Promise<AlertRunTrendData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const runs = await db.query.alertRuns.findMany({
    where: and(
      eq(alertRuns.alertId, alertId),
      gte(alertRuns.executedAt, cutoffDate)
    ),
    orderBy: [desc(alertRuns.executedAt)],
  });

  return runs.map(run => ({
    date: run.executedAt.toISOString(),
    matchingListings: run.matchingListings,
    newListings: run.newListings,
    duplicateListings: run.duplicateListings,
    notificationsSent: run.notificationsSent,
    status: run.status,
  }));
}

/**
 * Get comparison data between time periods
 */
export async function getAlertRunComparison(alertId: string) {
  const now = new Date();

  // This week
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const thisWeekRuns = await db.query.alertRuns.findMany({
    where: and(
      eq(alertRuns.alertId, alertId),
      gte(alertRuns.executedAt, weekStart)
    ),
  });

  // Last week
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekRuns = await db.query.alertRuns.findMany({
    where: and(
      eq(alertRuns.alertId, alertId),
      gte(alertRuns.executedAt, lastWeekStart),
      sql`${alertRuns.executedAt} < ${weekStart}`
    ),
  });

  const calculateWeekStats = (runs: typeof thisWeekRuns) => ({
    totalRuns: runs.length,
    totalMatching: runs.reduce((sum, r) => sum + r.matchingListings, 0),
    totalNew: runs.reduce((sum, r) => sum + r.newListings, 0),
    totalNotifications: runs.reduce((sum, r) => sum + r.notificationsSent, 0),
  });

  const thisWeek = calculateWeekStats(thisWeekRuns);
  const lastWeek = calculateWeekStats(lastWeekRuns);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    thisWeek,
    lastWeek,
    changes: {
      runs: calculateChange(thisWeek.totalRuns, lastWeek.totalRuns),
      matching: calculateChange(thisWeek.totalMatching, lastWeek.totalMatching),
      new: calculateChange(thisWeek.totalNew, lastWeek.totalNew),
      notifications: calculateChange(thisWeek.totalNotifications, lastWeek.totalNotifications),
    },
  };
}

/**
 * Get most recent run for an alert
 */
export async function getLatestAlertRun(alertId: string) {
  return db.query.alertRuns.findFirst({
    where: eq(alertRuns.alertId, alertId),
    orderBy: [desc(alertRuns.executedAt)],
  });
}

/**
 * Get summary statistics for multiple alerts
 */
export async function getMultipleAlertStats(alertIds: string[]) {
  const statsPromises = alertIds.map(id => getAlertStats(id));
  const allStats = await Promise.all(statsPromises);

  return alertIds.reduce((acc, id, index) => {
    acc[id] = allStats[index];
    return acc;
  }, {} as Record<string, AlertRunStats>);
}
