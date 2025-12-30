/**
 * Verification script for the "No matches found" fix
 * Run with: npx tsx scripts/verify-fix.ts
 *
 * This script tests the complete fix including:
 * 1. Google CSE API is working
 * 2. Fallback search logic works when job titles are empty
 * 3. Various edge cases pass
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  jobs: number;
  error?: string;
}

async function runTest(name: string, resume: object): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/debug-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsedResume: resume }),
    });

    const data = await response.json();

    return {
      name,
      passed: data.success && data.jobCount > 0,
      jobs: data.jobCount || 0,
      error: data.error,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      jobs: 0,
      error: String(error),
    };
  }
}

async function main() {
  console.log('🔍 JobMatch Fix Verification Script\n');
  console.log('=' .repeat(60) + '\n');

  // Check if server is running
  try {
    await fetch(`${BASE_URL}/api/debug-search?test=true`);
  } catch {
    console.log('❌ Server not running! Please start with: npm run dev\n');
    process.exit(1);
  }

  const results: TestResult[] = [];

  // Test 1: Normal resume with job titles
  results.push(await runTest('Normal Resume (with job titles)', {
    jobTitles: ['Software Engineer', 'Full Stack Developer'],
    skills: ['JavaScript', 'React'],
    yearsExperience: 5,
    location: 'San Francisco, CA',
    industries: ['Technology'],
    education: "Bachelor's in CS",
    jobTypes: ['full-time'],
  }));

  // Test 2: Resume with empty job titles but skills (CRITICAL FIX TEST)
  results.push(await runTest('Empty Job Titles with Skills (CRITICAL)', {
    jobTitles: [],
    skills: ['Python', 'JavaScript', 'React', 'AWS'],
    yearsExperience: 4,
    location: 'New York, NY',
    industries: ['Technology'],
    education: "Master's in Data Science",
    jobTypes: ['full-time', 'remote'],
  }));

  // Test 3: Completely empty resume (ULTIMATE FALLBACK TEST)
  results.push(await runTest('Completely Empty Resume (Ultimate Fallback)', {
    jobTitles: [],
    skills: [],
    yearsExperience: null,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  }));

  // Test 4: Non-tech resume
  results.push(await runTest('Non-Tech Resume', {
    jobTitles: ['Registered Nurse', 'Nurse Practitioner'],
    skills: ['Patient Care'],
    yearsExperience: 10,
    location: 'Chicago, IL',
    industries: ['Healthcare'],
    education: 'BSN',
    jobTypes: ['full-time'],
  }));

  // Test 5: No location
  results.push(await runTest('No Location', {
    jobTitles: ['Product Manager'],
    skills: [],
    yearsExperience: 3,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  }));

  // Print results
  console.log('📊 RESULTS\n');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.name}`);
    console.log(`       Jobs found: ${result.jobs}`);
    if (result.error) {
      console.log(`       Error: ${result.error}`);
    }
    console.log('-'.repeat(60));

    if (result.passed) passed++;
    else failed++;
  }

  console.log(`\n📈 SUMMARY: ${passed}/${results.length} tests passed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! The fix is working correctly.');
    console.log('\nThe job search will now:');
    console.log('  1. Use job titles from the resume when available');
    console.log('  2. Generate fallback search terms from skills if no job titles');
    console.log('  3. Use generic job titles as ultimate fallback\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
