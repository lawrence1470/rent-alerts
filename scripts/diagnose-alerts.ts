/**
 * Diagnostic Script for Alert System
 *
 * Checks:
 * 1. Active alerts in database
 * 2. Alert batches configuration
 * 3. Recent cron job executions
 * 4. API connectivity (if keys present)
 * 5. Notification queue status
 */

import { db } from '../lib/db';
import { alerts, alertBatches, cronJobLogs, notifications, listings, alertRuns } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { getStreetEasyClient } from '../lib/services/streeteasy-api.service';

async function diagnose() {
  console.log('='.repeat(80));
  console.log('RENTAL ALERT SYSTEM DIAGNOSTICS');
  console.log('='.repeat(80));
  console.log();

  // 1. Check active alerts
  console.log('1. ACTIVE ALERTS');
  console.log('-'.repeat(80));
  const activeAlerts = await db.query.alerts.findMany({
    where: eq(alerts.isActive, true),
  });
  console.log(`Found ${activeAlerts.length} active alerts`);

  if (activeAlerts.length === 0) {
    console.log('❌ NO ACTIVE ALERTS - This is the problem!');
    console.log('   Users need to create alerts for the system to work.');
  } else {
    activeAlerts.forEach((alert, idx) => {
      console.log(`\n  Alert ${idx + 1}: ${alert.name}`);
      console.log(`    User ID: ${alert.userId}`);
      console.log(`    Areas: ${alert.areas}`);
      console.log(`    Price: $${alert.minPrice || 'any'} - $${alert.maxPrice || 'any'}`);
      console.log(`    Beds: ${alert.minBeds || 'any'} - ${alert.maxBeds || 'any'}`);
      console.log(`    Frequency: ${alert.preferredFrequency}`);
      console.log(`    Last Checked: ${alert.lastChecked ? alert.lastChecked.toISOString() : 'Never'}`);
      console.log(`    Notifications: Email=${alert.enableEmailNotifications}, Phone=${alert.enablePhoneNotifications}`);
      console.log(`    Only New: ${alert.notifyOnlyNewApartments}`);
    });
  }
  console.log();

  // 2. Check alert batches
  console.log('2. ALERT BATCHES');
  console.log('-'.repeat(80));
  const batches = await db.query.alertBatches.findMany();
  console.log(`Found ${batches.length} batches`);

  if (batches.length === 0 && activeAlerts.length > 0) {
    console.log('⚠️  No batches found - alerts may need to be rebatched');
  } else {
    batches.forEach((batch, idx) => {
      console.log(`\n  Batch ${idx + 1}:`);
      console.log(`    Areas: ${batch.areas}`);
      console.log(`    Alert Count: ${batch.alertCount}`);
      console.log(`    Last Fetched: ${batch.lastFetched ? batch.lastFetched.toISOString() : 'Never'}`);
    });
  }
  console.log();

  // 3. Check recent cron executions
  console.log('3. RECENT CRON JOB EXECUTIONS (Last 10)');
  console.log('-'.repeat(80));
  const recentCrons = await db.query.cronJobLogs.findMany({
    orderBy: (cronJobLogs, { desc }) => [desc(cronJobLogs.startedAt)],
    limit: 10,
  });

  if (recentCrons.length === 0) {
    console.log('❌ NO CRON EXECUTIONS FOUND');
    console.log('   The cron job has never run or is not configured properly.');
    console.log('   Check CRON_SECRET in environment variables.');
  } else {
    recentCrons.forEach((log, idx) => {
      console.log(`\n  Execution ${idx + 1}:`);
      console.log(`    Status: ${log.status}`);
      console.log(`    Started: ${log.startedAt.toISOString()}`);
      console.log(`    Duration: ${log.duration || 'N/A'}ms`);
      console.log(`    Alerts Processed: ${log.alertsProcessed || 0}`);
      console.log(`    Batches Fetched: ${log.batchesFetched || 0}`);
      console.log(`    New Listings: ${log.newListingsFound || 0}`);
      console.log(`    Notifications Created: ${log.notificationsCreated || 0}`);
      if (log.errorMessage) {
        console.log(`    ❌ Error: ${log.errorMessage}`);
      }
    });
  }
  console.log();

  // 4. Check alert runs (individual alert execution history)
  console.log('4. RECENT ALERT RUNS (Last 20)');
  console.log('-'.repeat(80));
  const recentRuns = await db.query.alertRuns.findMany({
    orderBy: (alertRuns, { desc }) => [desc(alertRuns.executedAt)],
    limit: 20,
    with: {
      alert: true,
    },
  });

  if (recentRuns.length === 0) {
    console.log('No alert runs found');
  } else {
    recentRuns.forEach((run, idx) => {
      console.log(`\n  Run ${idx + 1}: ${run.alert?.name || 'Unknown Alert'}`);
      console.log(`    Executed: ${run.executedAt.toISOString()}`);
      console.log(`    Status: ${run.status}`);
      console.log(`    Total from Batch: ${run.totalListingsFromBatch}`);
      console.log(`    Matching: ${run.matchingListings}`);
      console.log(`    New: ${run.newListings}`);
      console.log(`    Duplicates: ${run.duplicateListings}`);
      console.log(`    Notifications: ${run.notificationsSent}`);
      if (run.skipReason) {
        console.log(`    Skip Reason: ${run.skipReason}`);
      }
      if (run.errorMessage) {
        console.log(`    ❌ Error: ${run.errorMessage}`);
      }
    });
  }
  console.log();

  // 5. Check notifications
  console.log('5. NOTIFICATIONS STATUS');
  console.log('-'.repeat(80));
  const pendingNotifications = await db.query.notifications.findMany({
    where: eq(notifications.status, 'pending'),
  });
  const sentNotifications = await db.query.notifications.findMany({
    where: eq(notifications.status, 'sent'),
    limit: 10,
  });

  console.log(`Pending: ${pendingNotifications.length}`);
  console.log(`Recently Sent: ${sentNotifications.length}`);

  if (pendingNotifications.length > 0) {
    console.log('\n  Sample Pending Notifications:');
    pendingNotifications.slice(0, 5).forEach((notif, idx) => {
      console.log(`    ${idx + 1}. Channel: ${notif.channel}, Created: ${notif.createdAt.toISOString()}`);
    });
  }
  console.log();

  // 6. Check listings
  console.log('6. LISTINGS IN DATABASE');
  console.log('-'.repeat(80));
  const totalListings = await db.query.listings.findMany();
  const activeListings = totalListings.filter(l => l.isActive);
  const recentListings = totalListings
    .filter(l => l.firstSeenAt >= new Date(Date.now() - 24 * 60 * 60 * 1000))
    .sort((a, b) => b.firstSeenAt.getTime() - a.firstSeenAt.getTime());

  console.log(`Total Listings: ${totalListings.length}`);
  console.log(`Active Listings: ${activeListings.length}`);
  console.log(`New in Last 24h: ${recentListings.length}`);

  if (recentListings.length > 0) {
    console.log('\n  Recent Listings:');
    recentListings.slice(0, 5).forEach((listing, idx) => {
      console.log(`    ${idx + 1}. ${listing.address || 'No address'} - $${listing.price}`);
      console.log(`       First Seen: ${listing.firstSeenAt.toISOString()}`);
      console.log(`       Beds: ${listing.bedrooms}, Baths: ${listing.bathrooms}`);
    });
  }
  console.log();

  // 7. Test API connectivity
  console.log('7. API CONNECTIVITY TEST');
  console.log('-'.repeat(80));

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    console.log('❌ RAPIDAPI_KEY not found in environment variables');
    console.log('   The system cannot fetch listings without this key.');
  } else {
    console.log('✅ RAPIDAPI_KEY is set');

    // Try a simple API test if we have active alerts
    if (activeAlerts.length > 0) {
      try {
        console.log('\n  Testing API with first alert criteria...');
        const testAlert = activeAlerts[0];
        const apiClient = getStreetEasyClient();
        const testResult = await apiClient.searchRentals({
          areas: testAlert.areas,
          minPrice: testAlert.minPrice ?? undefined,
          maxPrice: testAlert.maxPrice ?? undefined,
          limit: 5,
        });

        console.log(`  ✅ API call successful!`);
        console.log(`     Found ${testResult.total} total listings`);
        console.log(`     Returned ${testResult.listings.length} listings`);

        if (testResult.listings.length > 0) {
          console.log('\n     Sample listing:');
          const sample = testResult.listings[0];
          console.log(`     - ID: ${sample.id}`);
          console.log(`     - Price: $${sample.price}`);
          console.log(`     - URL: ${sample.url}`);
        }
      } catch (error) {
        console.log(`  ❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  console.log();

  // 8. Summary and recommendations
  console.log('8. DIAGNOSIS SUMMARY');
  console.log('='.repeat(80));

  const issues: string[] = [];
  const warnings: string[] = [];

  if (activeAlerts.length === 0) {
    issues.push('No active alerts - users need to create alerts');
  }

  if (recentCrons.length === 0) {
    issues.push('Cron job has never executed - check CRON_SECRET and Vercel cron configuration');
  } else {
    const lastCron = recentCrons[0];
    if (lastCron.status === 'failed') {
      issues.push(`Last cron execution failed: ${lastCron.errorMessage}`);
    }

    const lastRunTime = lastCron.startedAt.getTime();
    const timeSince = Date.now() - lastRunTime;
    const minutesSince = Math.floor(timeSince / (1000 * 60));

    if (minutesSince > 30) {
      warnings.push(`Last cron run was ${minutesSince} minutes ago - expected every 15 minutes`);
    }
  }

  if (!rapidApiKey) {
    issues.push('RAPIDAPI_KEY not configured - cannot fetch listings');
  }

  if (batches.length === 0 && activeAlerts.length > 0) {
    warnings.push('Alert batches need to be rebuilt - run rebuildAllBatches()');
  }

  if (activeAlerts.length > 0 && recentRuns.length > 0) {
    const runsWithNewListings = recentRuns.filter(r => r.newListings > 0);
    if (runsWithNewListings.length === 0) {
      warnings.push('No new listings found in recent runs - might be deduplication issue or API returning same data');
    }
  }

  console.log('\n❌ CRITICAL ISSUES:');
  if (issues.length === 0) {
    console.log('   None');
  } else {
    issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue}`);
    });
  }

  console.log('\n⚠️  WARNINGS:');
  if (warnings.length === 0) {
    console.log('   None');
  } else {
    warnings.forEach((warning, idx) => {
      console.log(`   ${idx + 1}. ${warning}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Run diagnostics
diagnose()
  .then(() => {
    console.log('\nDiagnostics complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });
