/**
 * Test script for job search functionality
 * Run with: npx tsx test-job-search.ts
 */

import dotenv from 'dotenv';
import { searchJobs, buildSearchQuery, extractLocation } from './lib/job-search';
import { ParsedResume } from './lib/types';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Sample parsed resume data (simpler for testing)
const sampleParsedResume: ParsedResume = {
  jobTitles: ['product manager'],
  skills: ['JavaScript', 'Python'],
  yearsExperience: 5,
  location: 'San Francisco',
  industries: ['Technology'],
  education: "Bachelor's in Computer Science",
  jobTypes: ['full-time'],
};

async function testJobSearch() {
  console.log('🧪 Testing Job Search (Google Custom Search API)\n');
  console.log('='.repeat(60));

  // Test 1: Query builder
  console.log('\n1. Testing query builder...');
  const jobTitle = sampleParsedResume.jobTitles[0];
  const location = extractLocation(sampleParsedResume);
  const searchQuery = buildSearchQuery(jobTitle, location);
  console.log(`   ✓ Job title: "${jobTitle}"`);
  console.log(`   ✓ Location: "${location}"`);
  console.log(`   ✓ Search query: "${searchQuery}"`);

  // Test 2: Google API credentials
  console.log('\n2. Checking Google API credentials...');
  if (!process.env.GOOGLE_API_KEY) {
    console.error('   ✗ GOOGLE_API_KEY not set!');
    process.exit(1);
  }
  if (!process.env.GOOGLE_SEARCH_ENGINE_ID) {
    console.error('   ✗ GOOGLE_SEARCH_ENGINE_ID not set!');
    process.exit(1);
  }
  console.log(`   ✓ Google API Key: ${process.env.GOOGLE_API_KEY.substring(0, 8)}...`);
  console.log(`   ✓ Search Engine ID: ${process.env.GOOGLE_SEARCH_ENGINE_ID.substring(0, 8)}...`);

  // Test 3: Search for jobs
  console.log('\n3. Searching for jobs...');
  try {
    const jobs = await searchJobs(sampleParsedResume, 25);
    console.log(`   ✓ Search: SUCCESS`);
    console.log(`   ✓ Found ${jobs.length} jobs\n`);

    if (jobs.length > 0) {
      console.log('📋 Sample Job Results:');
      console.log('='.repeat(60));

      // Show first 3 jobs
      jobs.slice(0, 3).forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   🏢 ${job.company}`);
        console.log(`   📍 ${job.location}`);
        console.log(`   📌 ${job.source}`);
        if (job.salary) {
          console.log(`   💰 ${job.salary}`);
        }
        console.log(`   🔗 ${job.url.substring(0, 60)}...`);
      });

      if (jobs.length > 3) {
        console.log(`\n... and ${jobs.length - 3} more jobs`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ All tests passed!');
    } else {
      console.log('\n⚠️  No jobs found for this search criteria.');
      console.log('   This might be due to:');
      console.log('   - Very specific search terms');
      console.log('   - Location constraints');
      console.log('   - Temporary API data availability');
    }

  } catch (error) {
    console.error('   ✗ Search: FAILED');
    console.error('   Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Test 4: Empty resume handling
async function testEmptyResume() {
  console.log('\n\n4. Testing empty resume handling...');
  const emptyResume: ParsedResume = {
    jobTitles: [],
    skills: [],
    yearsExperience: null,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  };

  const location = extractLocation(emptyResume);
  const query = buildSearchQuery('developer', location); // Fallback job title

  console.log(`   ✓ Location (null resume): "${location}"`);
  console.log(`   ✓ Query with fallback title: "${query}"`);
}

// Run all tests
async function runTests() {
  await testJobSearch();
  await testEmptyResume();
  console.log('\n🎉 Test suite completed!\n');
}

runTests().catch(console.error);
