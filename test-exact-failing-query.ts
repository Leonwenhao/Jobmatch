/**
 * Test the exact query that's failing in job search
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testExactQuery() {
  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ SERPER_API_KEY not found');
    process.exit(1);
  }

  // The exact query from our job search that's failing
  const exactQuery = '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com) "Executive Producer & Creator"';

  console.log('🔍 Testing Exact Failing Query\n');
  console.log('Query:', exactQuery);
  console.log('Query Length:', exactQuery.length, 'characters\n');

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: exactQuery,
        num: 25,
        gl: 'us',
      }),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('\nResponse Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('ratelimit') || key.includes('limit')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('\n❌ Error Response:', responseText);
    } else {
      const data = JSON.parse(responseText);
      console.log(`\n✅ Success! Found ${data.organic?.length || 0} results`);

      if (data.organic && data.organic.length > 0) {
        console.log('\nFirst 3 results:');
        data.organic.slice(0, 3).forEach((result: any, index: number) => {
          console.log(`\n${index + 1}. ${result.title}`);
          console.log(`   ${result.link.substring(0, 70)}...`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Request Error:', error);
  }
}

testExactQuery();
