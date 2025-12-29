/**
 * Test to find the exact limit on number of site: operators
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testQuery(numSites: number) {
  const apiKey = process.env.SERPER_API_KEY?.trim()!;

  const sites = [
    'site:jobs.ashbyhq.com',
    'site:boards.greenhouse.io',
    'site:jobs.lever.co',
    'site:jobs.workable.com',
    'site:recruiting.paylocity.com',
    'site:jobs.smartrecruiters.com'
  ];

  const selectedSites = sites.slice(0, numSites).join(' OR ');
  const query = `(${selectedSites}) "Producer"`;

  console.log(`\nTest with ${numSites} sites:`);
  console.log(`Query: ${query}`);

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        gl: 'us',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ FAILED: ${response.status}`);
    } else {
      const data = await response.json();
      console.log(`✅ SUCCESS: Found ${data.organic?.length || 0} results`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));
}

async function runTests() {
  console.log('🔍 Testing Site: Operator Limits\n');
  console.log('='.repeat(60));

  for (let i = 1; i <= 6; i++) {
    await testQuery(i);
  }

  console.log('\n' + '='.repeat(60));
}

runTests();
