/**
 * Test Serper with simple job query (no site: operators)
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testSimpleJobQuery() {
  console.log('🔍 Testing Simple Job Query\n');

  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ SERPER_API_KEY not found');
    process.exit(1);
  }

  // Test 1: Simple job query (no site: operators)
  const simpleQuery = 'Executive Producer jobs Boston';
  console.log('Query:', simpleQuery);

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: simpleQuery,
        num: 10,
        gl: 'us',
      }),
    });

    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`\n✅ Found ${data.organic?.length || 0} results\n`);

    if (data.organic && data.organic.length > 0) {
      console.log('Sample Results:');
      console.log('='.repeat(60));
      data.organic.slice(0, 5).forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   Link: ${result.link}`);
        console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));

  // Test 2: Query with site: operator (single site)
  const singleSiteQuery = 'site:jobs.lever.co "Producer"';
  console.log('\nTest 2: Single site: operator');
  console.log('Query:', singleSiteQuery);

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: singleSiteQuery,
        num: 10,
        gl: 'us',
      }),
    });

    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
    } else {
      const data = await response.json();
      console.log(`✅ Found ${data.organic?.length || 0} results`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));

  // Test 3: Multiple site: operators (like our actual query)
  const multiSiteQuery = '(site:jobs.lever.co OR site:boards.greenhouse.io) "Producer"';
  console.log('\nTest 3: Multiple site: operators');
  console.log('Query:', multiSiteQuery);

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: multiSiteQuery,
        num: 10,
        gl: 'us',
      }),
    });

    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
    } else {
      const data = await response.json();
      console.log(`✅ Found ${data.organic?.length || 0} results`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSimpleJobQuery();
