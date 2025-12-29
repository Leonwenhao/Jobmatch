/**
 * Test the exact query with ampersand
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAmpersandQuery() {
  const apiKey = process.env.SERPER_API_KEY?.trim()!;

  const query = '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com) "Executive Producer & Creator"';

  console.log('🔍 Testing Query with Ampersand\n');
  console.log('Query:', query);
  console.log('Length:', query.length, 'chars\n');

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 25,
        gl: 'us',
      }),
    });

    console.log('Status:', response.status, response.statusText);

    const responseText = await response.text();

    if (!response.ok) {
      console.log('❌ Error Response:', responseText);
    } else {
      const data = JSON.parse(responseText);
      console.log(`✅ SUCCESS: Found ${data.organic?.length || 0} results`);

      if (data.organic && data.organic.length > 0) {
        console.log('\nSample Results:');
        data.organic.slice(0, 5).forEach((result: any, index: number) => {
          console.log(`\n${index + 1}. ${result.title}`);
          console.log(`   Link: ${result.link}`);
          console.log(`   Source: ${new URL(result.link).hostname}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Request Error:', error);
  }
}

testAmpersandQuery();
