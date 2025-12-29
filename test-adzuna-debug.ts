import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Debug script to test Adzuna API directly
 */

async function testAdzunaAPI() {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();

  console.log('=== Testing Adzuna API ===\n');
  console.log('App ID:', appId);
  console.log('App Key:', appKey?.substring(0, 8) + '...\n');

  if (!appId || !appKey) {
    console.error('❌ Missing Adzuna credentials in .env.local');
    return;
  }

  // Test 1: Very simple search
  console.log('TEST 1: Simple search for "software engineer"');
  console.log('-------------------------------------------');

  const params1 = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: 'software engineer',
    results_per_page: '5',
  });

  const url1 = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params1.toString()}`;
  console.log('URL:', url1.replace(appKey, 'REDACTED'));

  try {
    const response1 = await fetch(url1);
    console.log('Status:', response1.status, response1.statusText);

    if (!response1.ok) {
      const errorText = await response1.text();
      console.error('Error Response:', errorText);
    } else {
      const data1 = await response1.json();
      console.log('✅ Success!');
      console.log('Total available jobs:', data1.count);
      console.log('Returned jobs:', data1.results.length);

      if (data1.results.length > 0) {
        console.log('\nFirst job:');
        console.log('  Title:', data1.results[0].title);
        console.log('  Company:', data1.results[0].company.display_name);
        console.log('  Location:', data1.results[0].location.display_name);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 2: Test with location
  console.log('TEST 2: Search "developer" in "New York"');
  console.log('-------------------------------------------');

  const params2 = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: 'developer',
    where: 'New York',
    results_per_page: '5',
  });

  const url2 = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params2.toString()}`;
  console.log('URL:', url2.replace(appKey, 'REDACTED'));

  try {
    const response2 = await fetch(url2);
    console.log('Status:', response2.status, response2.statusText);

    if (!response2.ok) {
      const errorText = await response2.text();
      console.error('Error Response:', errorText);
    } else {
      const data2 = await response2.json();
      console.log('✅ Success!');
      console.log('Total available jobs:', data2.count);
      console.log('Returned jobs:', data2.results.length);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n');

  // Test 3: Very broad search with no filters
  console.log('TEST 3: Broad search - just "job"');
  console.log('-------------------------------------------');

  const params3 = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: 'job',
    results_per_page: '10',
  });

  const url3 = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params3.toString()}`;
  console.log('URL:', url3.replace(appKey, 'REDACTED'));

  try {
    const response3 = await fetch(url3);
    console.log('Status:', response3.status, response3.statusText);

    if (!response3.ok) {
      const errorText = await response3.text();
      console.error('Error Response:', errorText);
    } else {
      const data3 = await response3.json();
      console.log('✅ Success!');
      console.log('Total available jobs:', data3.count);
      console.log('Returned jobs:', data3.results.length);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }

  console.log('\n=== Tests Complete ===');
}

testAdzunaAPI();
