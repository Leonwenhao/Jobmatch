/**
 * Test variations with ampersand
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testQuery(description: string, query: string) {
  const apiKey = process.env.SERPER_API_KEY?.trim()!;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${description}`);
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
  console.log('🔍 Testing Ampersand & Special Character Variations\n');

  const sites = '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com)';

  // Test 1: With ampersand
  await testQuery(
    'With ampersand (&)',
    `${sites} "Executive Producer & Creator"`
  );

  // Test 2: Without ampersand (using "and")
  await testQuery(
    'With "and" instead of &',
    `${sites} "Executive Producer and Creator"`
  );

  // Test 3: Just first part
  await testQuery(
    'Just "Executive Producer"',
    `${sites} "Executive Producer"`
  );

  // Test 4: Different title with ampersand
  await testQuery(
    'Different title with &',
    `${sites} "Sales & Marketing Manager"`
  );

  // Test 5: Simple test with ampersand (2 sites)
  await testQuery(
    'Simple with & (2 sites)',
    '(site:jobs.lever.co OR site:boards.greenhouse.io) "Executive Producer & Creator"'
  );

  console.log('\n' + '='.repeat(60));
}

runTests();
