/**
 * Cron Job Service
 *
 * Main orchestration service for the alert checking cron job
 * Runs every 15 minutes to check for new listings
 */

import { db } from '../db';
import { alerts, alertBatches, cronJobLogs } from '../schema';
import { eq } from 'drizzle-orm';
import { getActiveBatches, listingMatchesAlert } from './alert-batching.service';
import { getStreetEasyClient } from './streeteasy-api.service';
import { upsertListings, markListingsAsSeen } from './listing-deduplication.service';
import { generateNotificationsForAlert, getUserNotificationChannels, processSMSNotifications, processEmailNotifications } from './notification.service';
import { enrichListingsWithRentStabilization } from './rent-stabilization.service';
import { hasActiveTierAccess, canUseTierForAlert } from './access-validation.service';
import type { TierId } from '../stripe-config';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an alert should be checked based on its frequency and last check time
 */
function shouldCheckAlert(alert: any): boolean {
  if (!alert.lastChecked) {
    return true; // Never checked before
  }

  const lastChecked = new Date(alert.lastChecked);
  const now = new Date();
  const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);

  // Get the frequency interval in minutes
  const frequencyMinutes = {
    '15min': 15,
    '30min': 30,
    '1hour': 60,
  }[alert.preferredFrequency as TierId] || 60;

  // Check if enough time has passed since last check
  return minutesSinceLastCheck >= frequencyMinutes;
}

// ============================================================================
// MAIN CRON JOB
// ============================================================================

/**
 * Main function to check all active alerts for new listings
 * This is called by the Vercel cron endpoint every 15 minutes
 */
export async function checkAllAlerts(): Promise<CronJobResult> {
  const startTime = Date.now();
  const logId = await createCronJobLog('check-alerts', 'started');

  try {
    // Step 1: Get all active batches
    const batches = await getActiveBatches();
    console.log(`Processing ${batches.length} alert batches`);

    let totalNewListings = 0;
    let totalNotifications = 0;

    // Step 2: Process each batch
    for (const batch of batches) {
      try {
        // Fetch listings from StreetEasy API
        const apiClient = getStreetEasyClient();
        const apiListings = await apiClient.fetchBatch(batch.criteria);
        console.log(`Batch ${batch.batchId}: Found ${apiListings.length} listings`);

        if (apiListings.length === 0) continue;

        // Step 3: Upsert listings into database
        const dbListings = await upsertListings(apiListings);

        // Step 3.5: Enrich listings with rent stabilization data
        // Only enrich if there are listings that need enrichment
        const listingIds = dbListings.map(l => l.id);
        if (listingIds.length > 0) {
          console.log(`Enriching ${listingIds.length} listings with rent stabilization data...`);
          const enrichmentMetrics = await enrichListingsWithRentStabilization(listingIds);
          console.log(`Enrichment complete: ${enrichmentMetrics.successCount}/${enrichmentMetrics.listingsProcessed} succeeded, ${enrichmentMetrics.failureCount} failed`);
        }

        // Step 4: Get all alerts in this batch
        const batchAlerts = await db.query.alerts.findMany({
          where: eq(alerts.id, batch.alertIds[0]), // This will be improved below
        });

        // Properly fetch all alerts for this batch
        const allBatchAlerts = await Promise.all(
          batch.alertIds.map(alertId =>
            db.query.alerts.findFirst({ where: eq(alerts.id, alertId) })
          )
        );

        // Step 5: For each alert, filter listings and create notifications
        for (const alert of allBatchAlerts) {
          if (!alert || !alert.isActive) continue;

          // Check if this alert should be checked based on its frequency
          if (!shouldCheckAlert(alert)) {
            console.log(`Alert ${alert.name}: Skipping (not time yet for ${alert.preferredFrequency} checks)`);
            continue;
          }

          // Check if user has access to use this tier
          const preferredTier = alert.preferredFrequency as TierId;
          const { canUse, reason } = await canUseTierForAlert(alert.userId, preferredTier);

          if (!canUse) {
            console.log(`Alert ${alert.name}: User lacks access to ${preferredTier} tier - ${reason}`);
            // Fall back to free tier (1hour) if user doesn't have access
            if (preferredTier !== '1hour') {
              // Only check if it's time for hourly checks
              const hourlyLastChecked = alert.lastChecked ? new Date(alert.lastChecked) : null;
              const hoursSinceLastCheck = hourlyLastChecked
                ? (Date.now() - hourlyLastChecked.getTime()) / (1000 * 60 * 60)
                : 999;

              if (hoursSinceLastCheck < 1) {
                console.log(`Alert ${alert.name}: Falling back to free tier (1hour) - not time yet`);
                continue;
              }

              console.log(`Alert ${alert.name}: Using free tier (1hour) fallback`);
            }
          }

          // Filter listings that match this specific alert's criteria
          const matchingListings = dbListings.filter(listing =>
            listingMatchesAlert(listing, alert)
          );

          if (matchingListings.length === 0) continue;

          // Get listings this user hasn't seen yet
          const { filterNewListings } = await import('./listing-deduplication.service');
          const newListings = await filterNewListings(alert.userId, alert.id, matchingListings);

          if (newListings.length === 0) continue;

          console.log(`Alert ${alert.name}: ${newListings.length} new listings`);
          totalNewListings += newListings.length;

          // Get user's notification preferences based on alert settings
          const channels = await getUserNotificationChannels(alert);

          // Create notifications for each channel
          for (const channel of channels) {
            const notifications = await generateNotificationsForAlert(
              alert,
              newListings,
              channel
            );
            totalNotifications += notifications.length;
          }

          // Mark listings as seen
          await markListingsAsSeen(
            alert.userId,
            alert.id,
            newListings.map(l => l.id)
          );

          // Update alert's lastChecked timestamp
          await db.update(alerts)
            .set({ lastChecked: new Date() })
            .where(eq(alerts.id, alert.id));
        }

        // Update batch's lastFetched timestamp
        await db.update(alertBatches)
          .set({ lastFetched: new Date() })
          .where(eq(alertBatches.id, batch.dbId));

      } catch (error) {
        console.error(`Error processing batch ${batch.batchId}:`, error);
        // Continue with next batch even if this one fails
      }
    }

    // Step 6: Process pending SMS notifications
    let smsStats = { sent: 0, failed: 0 };
    try {
      console.log('Processing pending SMS notifications...');
      smsStats = await processSMSNotifications();
      console.log(`SMS notifications: ${smsStats.sent} sent, ${smsStats.failed} failed`);
    } catch (error) {
      console.error('Error processing SMS notifications:', error);
      // Don't fail the entire cron job if SMS processing fails
    }

    // Step 7: Process pending email notifications
    let emailStats = { sent: 0, failed: 0 };
    try {
      console.log('Processing pending email notifications...');
      emailStats = await processEmailNotifications();
      console.log(`Email notifications: ${emailStats.sent} sent, ${emailStats.failed} failed`);
    } catch (error) {
      console.error('Error processing email notifications:', error);
      // Don't fail the entire cron job if email processing fails
    }

    // Step 8: Log successful completion
    const duration = Date.now() - startTime;
    await completeCronJobLog(logId, 'completed', {
      alertsProcessed: batches.reduce((sum, b) => sum + b.alertIds.length, 0),
      batchesFetched: batches.length,
      newListingsFound: totalNewListings,
      notificationsCreated: totalNotifications,
      duration,
    });

    return {
      success: true,
      alertsProcessed: batches.reduce((sum, b) => sum + b.alertIds.length, 0),
      batchesFetched: batches.length,
      newListingsFound: totalNewListings,
      notificationsCreated: totalNotifications,
      smsSent: smsStats.sent,
      smsFailed: smsStats.failed,
      emailSent: emailStats.sent,
      emailFailed: emailStats.failed,
      duration,
    };

  } catch (error) {
    // Log failure
    const duration = Date.now() - startTime;
    await completeCronJobLog(logId, 'failed', {
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CronJobResult {
  success: boolean;
  alertsProcessed: number;
  smsSent?: number;
  smsFailed?: number;
  emailSent?: number;
  emailFailed?: number;
  batchesFetched: number;
  newListingsFound: number;
  notificationsCreated: number;
  duration: number;
  error?: string;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

async function createCronJobLog(
  jobName: string,
  status: 'started' | 'completed' | 'failed'
): Promise<string> {
  const [log] = await db.insert(cronJobLogs).values({
    jobName,
    status,
    startedAt: new Date(),
  }).returning();

  return log.id;
}

async function completeCronJobLog(
  logId: string,
  status: 'completed' | 'failed',
  data: {
    alertsProcessed?: number;
    batchesFetched?: number;
    newListingsFound?: number;
    notificationsCreated?: number;
    duration: number;
    error?: string;
    errorStack?: string;
  }
): Promise<void> {
  await db.update(cronJobLogs)
    .set({
      status,
      completedAt: new Date(),
      duration: data.duration,
      alertsProcessed: data.alertsProcessed,
      batchesFetched: data.batchesFetched,
      newListingsFound: data.newListingsFound,
      notificationsCreated: data.notificationsCreated,
      errorMessage: data.error,
      errorStack: data.errorStack,
    })
    .where(eq(cronJobLogs.id, logId));
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Gets recent cron job execution history
 */
export async function getCronJobHistory(limit: number = 50) {
  return db.query.cronJobLogs.findMany({
    orderBy: (cronJobLogs, { desc }) => [desc(cronJobLogs.startedAt)],
    limit,
  });
}

/**
 * Gets cron job statistics
 */
export async function getCronJobStats() {
  const recentJobs = await getCronJobHistory(100);

  const completed = recentJobs.filter(j => j.status === 'completed');
  const failed = recentJobs.filter(j => j.status === 'failed');

  const avgDuration = completed.length > 0
    ? completed.reduce((sum, j) => sum + (j.duration || 0), 0) / completed.length
    : 0;

  return {
    totalRuns: recentJobs.length,
    successRate: recentJobs.length > 0 ? (completed.length / recentJobs.length) * 100 : 0,
    averageDuration: Math.round(avgDuration),
    totalAlertsProcessed: completed.reduce((sum, j) => sum + (j.alertsProcessed || 0), 0),
    totalListingsFound: completed.reduce((sum, j) => sum + (j.newListingsFound || 0), 0),
    totalNotificationsCreated: completed.reduce((sum, j) => sum + (j.notificationsCreated || 0), 0),
    recentFailures: failed.slice(0, 5).map(j => ({
      timestamp: j.startedAt,
      error: j.errorMessage,
    })),
  };
}
