/**
 * Test the Firecrawl StreetEasy integration
 */

import { FirecrawlStreetEasyClient } from '../lib/services/firecrawl-streeteasy.service';
import { StreetEasyApiClient } from '../lib/services/streeteasy-api.service';
import type { BatchCriteria } from '../lib/services/alert-batching.service';

async function testFirecrawlDirect() {
  console.log('='.repeat(60));
  console.log('Testing Firecrawl Direct Client');
  console.log('='.repeat(60));

  const client = new FirecrawlStreetEasyClient();

  // Test 1: Build URL
  console.log('\n1. Testing URL building...');
  const url = client.buildSearchUrl('east-village', {
    minPrice: 2000,
    maxPrice: 4000,
    minBeds: 1,
  });
  console.log(`   URL: ${url}`);

  // Test 2: Single area scrape
  console.log('\n2. Testing single area scrape (east-village)...');
  try {
    const listings = await client.scrapeArea('east-village', {
      minPrice: 2000,
      maxPrice: 5000,
    });
    console.log(`   ✅ Found ${listings.length} listings`);

    if (listings.length > 0) {
      console.log('\n   Sample listing:');
      const sample = listings[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Price: $${sample.price}`);
      console.log(`   - Address: ${sample.address}`);
      console.log(`   - Beds: ${sample.bedrooms}`);
      console.log(`   - Baths: ${sample.bathrooms}`);
      console.log(`   - URL: ${sample.listingUrl}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
}

async function testBatchFetch() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Batch Fetch (Multiple Areas)');
  console.log('='.repeat(60));

  const client = new FirecrawlStreetEasyClient();

  const criteria: BatchCriteria = {
    areas: 'east-village, west-village',
    minPrice: 2500,
    maxPrice: 5000,
    minBeds: 1,
    maxBeds: 2,
    minBaths: 1,
    noFee: false,
  };

  console.log('\nCriteria:');
  console.log(`  Areas: ${criteria.areas}`);
  console.log(`  Price: $${criteria.minPrice} - $${criteria.maxPrice}`);
  console.log(`  Beds: ${criteria.minBeds} - ${criteria.maxBeds}`);

  try {
    const listings = await client.fetchBatch(criteria);
    console.log(`\n✅ Total unique listings: ${listings.length}`);

    // Group by neighborhood
    const byNeighborhood: Record<string, number> = {};
    for (const listing of listings) {
      const hood = listing.neighborhood || 'Unknown';
      byNeighborhood[hood] = (byNeighborhood[hood] || 0) + 1;
    }

    console.log('\nBy neighborhood:');
    for (const [hood, count] of Object.entries(byNeighborhood)) {
      console.log(`  - ${hood}: ${count} listings`);
    }

    // Price range
    const prices = listings.map((l) => l.price);
    console.log(`\nPrice range: $${Math.min(...prices)} - $${Math.max(...prices)}`);
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function testStreetEasyClient() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing StreetEasy API Client (via Firecrawl)');
  console.log('='.repeat(60));

  const client = new StreetEasyApiClient();

  console.log('\nSearching for rentals in Chelsea...');
  try {
    const response = await client.searchRentals({
      areas: 'chelsea',
      minPrice: 3000,
      maxPrice: 6000,
      minBeds: 1,
      limit: 10,
    });

    console.log(`✅ Found ${response.total} total listings`);
    console.log(`   Returned ${response.listings.length} listings (limit: 10)`);
    console.log(`   Has more: ${response.hasMore}`);

    if (response.listings.length > 0) {
      console.log('\n   First 3 listings:');
      for (const listing of response.listings.slice(0, 3)) {
        console.log(`   - $${listing.price}: ${listing.title || listing.address}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function main() {
  console.log('\n🔥 FIRECRAWL STREETEASY INTEGRATION TEST\n');

  // Check for API key
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY environment variable is not set');
    console.log('   Set it with: export FIRECRAWL_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log('✅ FIRECRAWL_API_KEY is set\n');

  await testFirecrawlDirect();
  await testBatchFetch();
  await testStreetEasyClient();

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
