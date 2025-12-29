/**
 * Test variations to isolate what's causing the block
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testQuery(description: string, query: string) {
  const apiKey = process.env.SERPER_API_KEY?.trim()!;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${description}`);
  console.log(`Query: ${query}`);
  console.log(`Length: ${query.length} chars`);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ FAILED: ${response.status} - ${errorText}`);
    } else {
      const data = await response.json();
      console.log(`✅ SUCCESS: Found ${data.organic?.length || 0} results`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}`);
  }

  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function runTests() {
  console.log('🔍 Testing Query Variations\n');

  // Test 1: 6 sites with simple job title
  await testQuery(
    '6 sites + simple title',
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com) "Producer"'
  );

  // Test 2: 6 sites with ampersand in title
  await testQuery(
    '6 sites + ampersand in title',
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com) "Executive Producer & Creator"'
  );

  // Test 3: 3 sites with ampersand
  await testQuery(
    '3 sites + ampersand in title',
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co) "Executive Producer & Creator"'
  );

  // Test 4: 4 sites with simple title
  await testQuery(
    '4 sites + simple title',
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com) "Producer"'
  );

  // Test 5: 5 sites with simple title
  await testQuery(
    '5 sites + simple title',
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com) "Producer"'
  );

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Tests complete!');
}

runTests();
