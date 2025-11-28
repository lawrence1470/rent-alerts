/**
 * Test problematic area name variations to find API-compatible slugs
 */

const apiKey = process.env.RAPIDAPI_KEY || '';

async function testArea(name: string, areas: string) {
  const url = `https://streeteasy-api.p.rapidapi.com/rentals/search?areas=${encodeURIComponent(areas)}&limit=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'streeteasy-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: "${areas}" → ${data.pagination?.count || 0} listings`);
      return true;
    } else {
      const text = await response.text();
      console.log(`❌ ${name}: "${areas}" → ${text.substring(0, 60)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error}`);
    return false;
  }
}

async function run() {
  // Test Fulton/Seaport variations
  console.log('=== Fulton/Seaport Variations ===');
  await testArea('fulton-seaport', 'fulton-seaport');
  await testArea('seaport', 'seaport');
  await testArea('fulton', 'fulton');
  await testArea('south-street-seaport', 'south-street-seaport');

  // Test Stuyvesant Town variations
  console.log('\n=== Stuyvesant Town/PCV Variations ===');
  await testArea('stuyvesant-town', 'stuyvesant-town');
  await testArea('stuyvesant-town-pcv', 'stuyvesant-town-pcv');
  await testArea('stuy-town', 'stuy-town');
  await testArea('peter-cooper-village', 'peter-cooper-village');
  await testArea('pcv', 'pcv');

  // Test Hell's Kitchen variations
  console.log("\n=== Hell's Kitchen Variations ===");
  await testArea('hells-kitchen', 'hells-kitchen');
  await testArea('hell-kitchen', 'hell-kitchen');
  await testArea('midtown-west', 'midtown-west');

  // Test Bedford-Stuyvesant variations
  console.log('\n=== Bedford-Stuyvesant Variations ===');
  await testArea('bedford-stuyvesant', 'bedford-stuyvesant');
  await testArea('bed-stuy', 'bed-stuy');
  await testArea('bedstuy', 'bedstuy');

  // Check meta-areas
  console.log('\n=== Meta-Areas ===');
  await testArea('all-manhattan', 'all-manhattan');
  await testArea('all-brooklyn', 'all-brooklyn');
  await testArea('all-downtown', 'all-downtown');
}

run();
