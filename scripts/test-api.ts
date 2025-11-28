/**
 * Test StreetEasy API with different area formats
 */

const apiKey = process.env.RAPIDAPI_KEY!;

async function testArea(name: string, areas: string) {
  const url = `https://streeteasy-api.p.rapidapi.com/rentals/search?areas=${encodeURIComponent(areas)}&limit=5`;

  console.log(`\nTesting: ${name}`);
  console.log(`  Areas: "${areas}"`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'streeteasy-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });

    console.log(`  Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Found ${data.pagination?.count || 0} listings`);
    } else {
      const text = await response.text();
      console.log(`  ❌ Error: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error}`);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Testing StreetEasy API Area Formats');
  console.log('='.repeat(60));

  // Test 1: Known working format
  await testArea('Known working (all-downtown)', 'all-downtown');

  // Test 2: Single hyphenated area
  await testArea('Single hyphenated', 'east-village');

  // Test 3: Multiple areas comma-separated
  await testArea('Multiple hyphenated', 'east-village,chelsea,tribeca');

  // Test 4: URL-encoded comma
  await testArea('URL-encoded commas', 'east-village%2Cchelsea%2Ctribeca');

  // Test 5: With slash character
  await testArea('Area with slash (fulton/seaport)', 'fulton/seaport');
  await testArea('Area with slash hyphenated', 'fulton-seaport');

  // Test 6: Space vs hyphen
  await testArea('With spaces', 'east village');
  await testArea('With hyphens', 'east-village');

  // Test 7: Many areas
  const manyAreas = 'east-village,chelsea,tribeca,soho,noho,nolita,west-village,greenwich-village,financial-district,battery-park-city';
  await testArea('10 areas', manyAreas);

  // Test 8: All Brooklyn (lots of areas)
  const brooklynAreas = 'williamsburg,bushwick,bed-stuy,crown-heights,park-slope,prospect-heights,fort-greene,clinton-hill,dumbo,brooklyn-heights';
  await testArea('10 Brooklyn areas', brooklynAreas);

  console.log('\n' + '='.repeat(60));
}

runTests();
