/**
 * Detailed Serper API test to examine full error response
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testSerperAPI() {
  console.log('🔍 Detailed Serper API Test\n');
  console.log('='.repeat(60));

  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    console.error('❌ SERPER_API_KEY not found in environment');
    process.exit(1);
  }

  console.log(`\nAPI Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`Key Length: ${apiKey.length} characters\n`);

  // Test 1: Simple query
  const simpleQuery = 'software engineer jobs';

  console.log('Test 1: Simple Query');
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
        num: 5,
        gl: 'us',
      }),
    });

    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const responseText = await response.text();
    console.log('\nResponse Body:');
    console.log(responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Success! Got', data.organic?.length || 0, 'results');
    } else {
      console.log('\n❌ Error Response');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Parsed Error:', JSON.stringify(errorData, null, 2));
      } catch {
        console.log('Raw Error Text:', responseText);
      }
    }

  } catch (error) {
    console.error('\n❌ Request Failed:', error);
  }

  console.log('\n' + '='.repeat(60));

  // Test 2: Check account status with a minimal query
  console.log('\nTest 2: Minimal Query (to check account status)');

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'test',
        num: 1,
      }),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

  } catch (error) {
    console.error('Error:', error);
  }
}

testSerperAPI();
