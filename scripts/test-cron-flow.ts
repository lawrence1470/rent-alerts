/**
 * Test the full cron job flow directly - with debugging
 */

import { db } from '../lib/db';
import { alerts, alertBatches } from '../lib/schema';
import { getActiveBatches } from '../lib/services/alert-batching.service';
import { StreetEasyApiClient } from '../lib/services/streeteasy-api.service';

async function testCronFlow() {
  console.log('='.repeat(60));
  console.log('Debugging Cron Job Flow');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Check alerts in DB
    console.log('1. Checking alerts in database...');
    const dbAlerts = await db.select().from(alerts);
    console.log(`   Found ${dbAlerts.length} alerts total`);

    for (const alert of dbAlerts) {
      console.log(`   - Alert: "${alert.name}"`);
      console.log(`     Areas: ${alert.areas}`);
      console.log(`     Active: ${alert.isActive}`);
      console.log(`     Price: $${alert.minPrice || 0} - $${alert.maxPrice || 'unlimited'}`);
    }

    // Step 2: Check batches
    console.log('\n2. Checking alert batches...');
    const dbBatches = await db.select().from(alertBatches);
    console.log(`   Found ${dbBatches.length} batches`);

    for (const batch of dbBatches) {
      console.log(`   - Batch areas: ${batch.areas}`);
    }

    // Step 3: Get active batches
    console.log('\n3. Getting active batches...');
    const activeBatches = await getActiveBatches();
    console.log(`   Found ${activeBatches.length} active batches`);

    if (activeBatches.length > 0) {
      const batch = activeBatches[0];
      console.log(`   First batch criteria:`);
      console.log(`     Areas: ${batch.criteria.areas}`);
      console.log(`     Min Price: ${batch.criteria.minPrice}`);
      console.log(`     Max Price: ${batch.criteria.maxPrice}`);

      // Step 4: Try API call with these params
      console.log('\n4. Testing API with batch criteria...');
      const client = new StreetEasyApiClient();

      try {
        const result = await client.searchRentals({
          areas: batch.criteria.areas,
          minPrice: batch.criteria.minPrice ?? undefined,
          maxPrice: batch.criteria.maxPrice ?? undefined,
          limit: 10,
        });
        console.log(`   ✅ API returned ${result.total} listings`);
      } catch (error) {
        console.log(`   ❌ API error: ${error}`);

        // Try with a known-working area
        console.log('\n5. Testing API with known-working params...');
        try {
          const testResult = await client.searchRentals({
            areas: 'east-village',
            minPrice: 2000,
            maxPrice: 4000,
            limit: 10,
          });
          console.log(`   ✅ Test API returned ${testResult.total} listings`);
          console.log(`   → The issue is with your alert's area format`);
          console.log(`   → Your areas: "${batch.criteria.areas}"`);
          console.log(`   → Working format: "east-village" (lowercase, hyphenated)`);
        } catch (testError) {
          console.log(`   ❌ Even test failed: ${testError}`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error);
  }
}

testCronFlow();
