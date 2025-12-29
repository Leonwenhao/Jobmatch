import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Debug script to test Serper API (Google Search) directly
 * Run with: npx tsx test-serper-debug.ts
 */

async function testSerperAPI() {
  const apiKey = process.env.SERPER_API_KEY?.trim();

  console.log('=== Testing Serper API ===\n');
  console.log('API Key:', apiKey?.substring(0, 8) + '...\n');

  if (!apiKey) {
    console.error('❌ Missing Serper API key in .env.local');
    return;
  }

  // Test 1: Simple search for software engineer jobs
  console.log('TEST 1: Search for "software engineer" jobs on job boards');
  console.log('-------------------------------------------');

  const query1 = '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io) "software engineer"';
  console.log('Query:', query1);

  try {
    const response1 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query1,
        num: 5,
        gl: 'us',
      }),
    });

    console.log('Status:', response1.status, response1.statusText);

    if (!response1.ok) {
      const errorText = await response1.text();
      console.error('Error Response:', errorText);
    } else {
      const data1 = await response1.json();
      console.log('✅ Success!');
      console.log('Returned jobs:', data1.organic?.length || 0);

      if (data1.organic && data1.organic.length > 0) {
        console.log('\nFirst job:');
        console.log('  Title:', data1.organic[0].title);
        console.log('  Link:', data1.organic[0].link);
        console.log('  Snippet:', data1.organic[0].snippet.substring(0, 100) + '...');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 2: Search with location
  console.log('TEST 2: Search "developer" in "New York"');
  console.log('-------------------------------------------');

  const query2 = '(site:jobs.lever.co OR site:jobs.workable.com) "developer" "New York"';
  console.log('Query:', query2);

  try {
    const response2 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query2,
        num: 5,
        gl: 'us',
      }),
    });

    console.log('Status:', response2.status, response2.statusText);

    if (!response2.ok) {
      const errorText = await response2.text();
      console.error('Error Response:', errorText);
    } else {
      const data2 = await response2.json();
      console.log('✅ Success!');
      console.log('Returned jobs:', data2.organic?.length || 0);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 3: Search across all job boards
  console.log('TEST 3: Broad search across all 6 job boards');
  console.log('-------------------------------------------');

  const query3 = '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.workable.com OR site:recruiting.paylocity.com OR site:jobs.smartrecruiters.com) "product manager"';
  console.log('Query:', query3.substring(0, 80) + '...');

  try {
    const response3 = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query3,
        num: 10,
        gl: 'us',
      }),
    });

    console.log('Status:', response3.status, response3.statusText);

    if (!response3.ok) {
      const errorText = await response3.text();
      console.error('Error Response:', errorText);
    } else {
      const data3 = await response3.json();
      console.log('✅ Success!');
      console.log('Returned jobs:', data3.organic?.length || 0);

      if (data3.organic && data3.organic.length > 0) {
        console.log('\nJob board distribution:');
        const boardCounts: Record<string, number> = {};
        data3.organic.forEach((result: any) => {
          if (result.link.includes('ashbyhq')) boardCounts['Ashby'] = (boardCounts['Ashby'] || 0) + 1;
          else if (result.link.includes('greenhouse')) boardCounts['Greenhouse'] = (boardCounts['Greenhouse'] || 0) + 1;
          else if (result.link.includes('lever')) boardCounts['Lever'] = (boardCounts['Lever'] || 0) + 1;
          else if (result.link.includes('workable')) boardCounts['Workable'] = (boardCounts['Workable'] || 0) + 1;
          else if (result.link.includes('paylocity')) boardCounts['Paylocity'] = (boardCounts['Paylocity'] || 0) + 1;
          else if (result.link.includes('smartrecruiters')) boardCounts['SmartRecruiters'] = (boardCounts['SmartRecruiters'] || 0) + 1;
        });
        Object.entries(boardCounts).forEach(([board, count]) => {
          console.log(`  ${board}: ${count} jobs`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n=== Tests Complete ===');
}

testSerperAPI();
