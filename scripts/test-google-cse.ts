/**
 * Test script for Google Custom Search API
 * Run with: npx tsx scripts/test-google-cse.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';

interface GoogleSearchResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    message: string;
    code: number;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
  queries?: {
    request?: Array<{
      totalResults: string;
      searchTerms: string;
    }>;
  };
}

async function testSearch(query: string, label: string): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();

  if (!apiKey || !searchEngineId) {
    console.error('Missing GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TEST: ${label}`);
  console.log('='.repeat(60));
  console.log(`Query: ${query}`);
  console.log(`Query length: ${query.length} characters`);

  const url = new URL(GOOGLE_CSE_API_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', searchEngineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '10');

  console.log(`\nRequest URL (without key): ${url.toString().replace(apiKey, 'REDACTED')}`);

  try {
    const response = await fetch(url.toString());
    const data: GoogleSearchResponse = await response.json();

    console.log(`\nHTTP Status: ${response.status}`);

    if (data.error) {
      console.log('\n❌ API ERROR:');
      console.log(`  Code: ${data.error.code}`);
      console.log(`  Message: ${data.error.message}`);
      if (data.error.errors) {
        data.error.errors.forEach(e => {
          console.log(`  - ${e.reason}: ${e.message}`);
        });
      }
      return;
    }

    if (data.searchInformation) {
      console.log('\n📊 Search Information:');
      console.log(`  Total Results: ${data.searchInformation.totalResults}`);
      console.log(`  Search Time: ${data.searchInformation.searchTime}s`);
    }

    if (data.queries?.request?.[0]) {
      console.log(`  Search Terms: ${data.queries.request[0].searchTerms}`);
    }

    if (data.items && data.items.length > 0) {
      console.log(`\n✅ Found ${data.items.length} results:`);
      data.items.slice(0, 5).forEach((item, i) => {
        console.log(`\n  ${i + 1}. ${item.title}`);
        console.log(`     URL: ${item.link}`);
        console.log(`     Snippet: ${item.snippet.substring(0, 100)}...`);
      });
    } else {
      console.log('\n⚠️  No results found');
    }

  } catch (error) {
    console.log('\n❌ FETCH ERROR:', error);
  }
}

async function main() {
  console.log('🔍 Google Custom Search API Test Suite\n');

  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();

  console.log('Environment Check:');
  console.log(`  GOOGLE_API_KEY: ${apiKey ? `✅ Set (${apiKey.length} chars)` : '❌ Missing'}`);
  console.log(`  GOOGLE_SEARCH_ENGINE_ID: ${searchEngineId ? `✅ Set (${searchEngineId})` : '❌ Missing'}`);

  if (!apiKey || !searchEngineId) {
    console.error('\nCannot proceed without credentials');
    process.exit(1);
  }

  // Test 1: Simple query (no site operators)
  await testSearch(
    'software engineer',
    'Simple query - no site operators'
  );

  // Test 2: Single site operator
  await testSearch(
    'site:boards.greenhouse.io software engineer',
    'Single site operator'
  );

  // Test 3: Multiple site operators with OR (current format)
  await testSearch(
    '(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR site:jobs.lever.co) "Software Engineer"',
    'Multiple site operators with OR (current implementation)'
  );

  // Test 4: Simpler OR syntax
  await testSearch(
    'site:boards.greenhouse.io OR site:jobs.lever.co software engineer',
    'Simpler OR syntax without parentheses'
  );

  // Test 5: Just the sites in parentheses (what CSE might interpret)
  await testSearch(
    'software engineer jobs.ashbyhq.com OR boards.greenhouse.io',
    'Without site: prefix'
  );

  // Test 6: Real-world query from the app
  const JOB_BOARD_SITES = [
    'jobs.ashbyhq.com',
    'boards.greenhouse.io',
    'jobs.lever.co',
    'jobs.workable.com',
    'recruiting.paylocity.com',
    'jobs.smartrecruiters.com',
    'careers.jobscore.com',
    'apply.workable.com',
  ];
  const fullSiteQuery = JOB_BOARD_SITES.map(site => `site:${site}`).join(' OR ');
  await testSearch(
    `(${fullSiteQuery}) "Senior Software Engineer" "San Francisco"`,
    'Full query with all 8 sites (actual app format)'
  );

  // Test 7: Check query length impact
  console.log('\n' + '='.repeat(60));
  console.log('QUERY LENGTH ANALYSIS');
  console.log('='.repeat(60));
  console.log(`Full site operators string length: ${fullSiteQuery.length} chars`);
  console.log(`Full query length: ${(`(${fullSiteQuery}) "Senior Software Engineer" "San Francisco"`).length} chars`);
  console.log(`Google CSE query limit: 2048 characters`);

  // Test 8: Try without quotes
  await testSearch(
    'site:boards.greenhouse.io Senior Software Engineer San Francisco',
    'Without quotes around title and location'
  );

  // Test 9: Just check if CSE is configured for web search
  await testSearch(
    'jobs',
    'Minimal query to verify CSE is working'
  );

  console.log('\n\n📋 SUMMARY');
  console.log('='.repeat(60));
  console.log('If tests with site: operators return 0 results but simple queries work,');
  console.log('the CSE might be configured to search specific sites only (not web-wide).');
  console.log('');
  console.log('If no tests work, check:');
  console.log('  1. CSE is not in "Search the entire web" mode');
  console.log('  2. API key has Custom Search API enabled');
  console.log('  3. Billing is set up in Google Cloud Console');
}

main().catch(console.error);
