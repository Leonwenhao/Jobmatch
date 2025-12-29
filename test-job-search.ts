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
  console.log('🧪 Testing Job Search\n');
  console.log('='.repeat(60));

  // Test 1: Query builder
  console.log('\n1. Testing query builder...');
  const searchQuery = buildSearchQuery(sampleParsedResume);
  console.log(`   ✓ Search query: "${searchQuery}"`);

  // Test 2: Location extraction
  console.log('\n2. Testing location extraction...');
  const location = extractLocation(sampleParsedResume);
  console.log(`   ✓ Location: "${location}"`);

  // Test 3: Serper API credentials
  console.log('\n3. Checking Serper API credentials...');
  if (!process.env.SERPER_API_KEY) {
    console.error('   ✗ SERPER_API_KEY not set!');
    process.exit(1);
  }
  console.log(`   ✓ Serper API Key: ${process.env.SERPER_API_KEY.substring(0, 8)}...`);

  // Test 4: Search for jobs
  console.log('\n4. Searching for jobs...');
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

// Test 5: Empty resume handling
async function testEmptyResume() {
  console.log('\n\n5. Testing empty resume handling...');
  const emptyResume: ParsedResume = {
    jobTitles: [],
    skills: [],
    yearsExperience: null,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  };

  const query = buildSearchQuery(emptyResume);
  const location = extractLocation(emptyResume);

  console.log(`   ✓ Empty query: "${query}"`);
  console.log(`   ✓ Default location: "${location}"`);
}

// Run all tests
async function runTests() {
  await testJobSearch();
  await testEmptyResume();
  console.log('\n🎉 Test suite completed!\n');
}

runTests().catch(console.error);
