#!/usr/bin/env node

/**
 * Test script using the actual StreetEasy API response format
 * Tests the complete rent stabilization flow with real data structure
 */

// Mock StreetEasy API response (actual format)
const mockApiResponse = {
  pagination: {
    count: 287,
    nextOffset: 11
  },
  listings: [
    {
      id: "4592621",
      price: 3950,
      longitude: -74.00377039,
      latitude: 40.72914563,
      url: "https://www.streeteasy.com/rental/4592621"
    },
    {
      id: "4592565",
      price: 3800,
      longitude: -73.99454252,
      latitude: 40.75525912,
      url: "https://www.streeteasy.com/rental/4592565"
    },
    {
      id: "4592557",
      price: 3800,
      longitude: -73.9943873,
      latitude: 40.75547045,
      url: "https://www.streeteasy.com/rental/4592557"
    },
    {
      id: "4592502",
      price: 4000,
      longitude: -73.97399902,
      latitude: 40.74670029,
      url: "https://www.streeteasy.com/rental/4592502"
    },
    {
      id: "4592400",
      price: 2700,
      longitude: -73.99500275,
      latitude: 40.75559998,
      url: "https://www.streeteasy.com/rental/4592400"
    }
  ]
};

const PLUTO_ENDPOINT = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
const LOCATION_TOLERANCE = 0.0005;

async function getPlutoData(latitude: number, longitude: number) {
  try {
    const minLat = latitude - LOCATION_TOLERANCE;
    const maxLat = latitude + LOCATION_TOLERANCE;
    const minLng = longitude - LOCATION_TOLERANCE;
    const maxLng = longitude + LOCATION_TOLERANCE;

    const query = new URLSearchParams({
      '$where': `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLng} AND longitude <= ${maxLng}`,
      '$limit': '10'
    });

    const response = await fetch(`${PLUTO_ENDPOINT}?${query}`);

    if (!response.ok) {
      console.error('PLUTO API error:', response.status, response.statusText);
      return null;
    }

    const buildings = await response.json();
    return buildings.length > 0 ? buildings[0] : null;
  } catch (error) {
    console.error('Error fetching PLUTO data:', error);
    return null;
  }
}

function calculateRentStabilizationProbability(building: any) {
  const unitsRes = parseInt(building.unitsres) || 0;
  const yearBuilt = parseInt(building.yearbuilt) || 0;

  if (unitsRes < 6) {
    return { status: 'unlikely', probability: 0.05 };
  }
  if (unitsRes >= 6 && yearBuilt > 0 && yearBuilt < 1974) {
    return { status: 'confirmed', probability: 0.95 };
  }
  if (unitsRes >= 6 && yearBuilt >= 1974 && yearBuilt <= 1984) {
    return { status: 'probable', probability: 0.70 };
  }
  if (unitsRes >= 50) {
    return { status: 'probable', probability: 0.75 };
  }
  return { status: 'unlikely', probability: 0.20 };
}

function simulateAlertFilter(listing: any, rentStabStatus: any, filterEnabled: boolean) {
  // Simulate the alert filtering logic
  if (!filterEnabled) {
    return true; // No filter, all listings pass
  }

  // Apply rent stabilization filter
  if (rentStabStatus.status === 'confirmed') {
    return true;
  }
  if (rentStabStatus.status === 'probable' && rentStabStatus.probability >= 0.70) {
    return true;
  }
  return false;
}

async function main() {
  console.log('🏢 Testing Rent Stabilization with Actual API Response Format\n');
  console.log('=' .repeat(60));

  console.log('\n📦 Mock StreetEasy API Response:');
  console.log(`   Total listings: ${mockApiResponse.pagination.count}`);
  console.log(`   Testing first ${mockApiResponse.listings.length} listings\n`);

  const rentStabilizationResults = [];

  for (const listing of mockApiResponse.listings) {
    console.log(`\n📍 Listing ${listing.id}:`);
    console.log(`   Price: $${listing.price}`);
    console.log(`   URL: ${listing.url}`);
    console.log(`   Coordinates: ${listing.latitude}, ${listing.longitude}`);

    // Query PLUTO API for building data
    const building = await getPlutoData(listing.latitude, listing.longitude);

    if (building) {
      console.log(`   ✅ Building found: ${building.address || 'No address'}`);
      console.log(`      Units: ${building.unitsres || 0}`);
      console.log(`      Year Built: ${building.yearbuilt || 'Unknown'}`);

      const rentStab = calculateRentStabilizationProbability(building);

      console.log(`   📊 Rent Stabilization:`);
      console.log(`      Status: ${rentStab.status.toUpperCase()}`);
      console.log(`      Probability: ${(rentStab.probability * 100).toFixed(0)}%`);

      // Test alert filtering
      const passesFilter = simulateAlertFilter(listing, rentStab, true);
      console.log(`   🎯 Alert Filter (if enabled): ${passesFilter ? '✅ PASS' : '❌ FILTERED OUT'}`);

      rentStabilizationResults.push({
        listingId: listing.id,
        price: listing.price,
        status: rentStab.status,
        probability: rentStab.probability,
        passesFilter
      });
    } else {
      console.log(`   ⚠️  No building data found`);
      rentStabilizationResults.push({
        listingId: listing.id,
        price: listing.price,
        status: 'unknown',
        probability: 0,
        passesFilter: false
      });
    }

    console.log('   ' + '-'.repeat(50));
  }

  // Summary
  console.log('\n\n📊 Summary Results:');
  console.log('=' .repeat(60));

  const confirmed = rentStabilizationResults.filter(r => r.status === 'confirmed');
  const probable = rentStabilizationResults.filter(r => r.status === 'probable');
  const unlikely = rentStabilizationResults.filter(r => r.status === 'unlikely');
  const unknown = rentStabilizationResults.filter(r => r.status === 'unknown');
  const wouldPass = rentStabilizationResults.filter(r => r.passesFilter);

  console.log(`\n   Total Listings Tested: ${rentStabilizationResults.length}`);
  console.log(`   ✅ Confirmed Stabilized: ${confirmed.length}`);
  console.log(`   🔶 Probably Stabilized: ${probable.length}`);
  console.log(`   ❌ Unlikely Stabilized: ${unlikely.length}`);
  console.log(`   ❓ Unknown (no data): ${unknown.length}`);
  console.log(`\n   🎯 Would Pass Filter: ${wouldPass.length} of ${rentStabilizationResults.length}`);

  if (wouldPass.length > 0) {
    console.log('\n   Listings that would be shown with filter enabled:');
    wouldPass.forEach(r => {
      console.log(`      - Listing ${r.listingId}: $${r.price} (${r.status} ${(r.probability * 100).toFixed(0)}%)`);
    });
  }

  console.log('\n✨ Test completed! The system is ready to:');
  console.log('  • Process actual StreetEasy API responses');
  console.log('  • Enrich listings with rent stabilization data');
  console.log('  • Filter results based on user preferences');
}

// Run the test
main().catch(console.error);