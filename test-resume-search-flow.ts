import dotenv from 'dotenv';
import { searchJobs } from './lib/adzuna';
import { ParsedResume } from './lib/types';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test the full resume-to-jobs flow with mock data
 * This simulates what should happen after Claude parses a resume
 */

async function testResumeSearchFlow() {
  console.log('=== Testing Resume Search Flow ===\n');

  // Test 1: Typical software engineer resume
  console.log('TEST 1: Software Engineer Resume');
  console.log('-------------------------------------------');

  const mockResume1: ParsedResume = {
    jobTitles: ['Software Engineer', 'Full Stack Developer'],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    yearsExperience: 5,
    location: 'New York, NY',
    industries: ['Technology', 'SaaS'],
    education: "Bachelor's in Computer Science",
    jobTypes: ['full-time', 'remote'],
  };

  console.log('Mock Resume Data:');
  console.log(JSON.stringify(mockResume1, null, 2));
  console.log('');

  try {
    const jobs1 = await searchJobs(mockResume1, 10);
    console.log(`✅ Found ${jobs1.length} jobs\n`);

    if (jobs1.length > 0) {
      console.log('First 3 jobs:');
      jobs1.slice(0, 3).forEach((job, i) => {
        console.log(`  ${i + 1}. ${job.title}`);
        console.log(`     Company: ${job.company}`);
        console.log(`     Location: ${job.location}`);
        console.log(`     URL: ${job.url}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No jobs found - this indicates a problem!\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n');

  // Test 2: What if Claude returns minimal data?
  console.log('TEST 2: Minimal Resume Data (edge case)');
  console.log('-------------------------------------------');

  const mockResume2: ParsedResume = {
    jobTitles: ['Developer'],
    skills: ['Java'],
    yearsExperience: 2,
    location: 'United States',
    industries: [],
    education: null,
    jobTypes: [],
  };

  console.log('Mock Resume Data:');
  console.log(JSON.stringify(mockResume2, null, 2));
  console.log('');

  try {
    const jobs2 = await searchJobs(mockResume2, 10);
    console.log(`✅ Found ${jobs2.length} jobs\n`);

    if (jobs2.length > 0) {
      console.log('Sample job:');
      console.log(`  ${jobs2[0].title} at ${jobs2[0].company}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n');

  // Test 3: What if Claude returns EMPTY data? (worst case)
  console.log('TEST 3: Empty Resume Data (worst case)');
  console.log('-------------------------------------------');

  const mockResume3: ParsedResume = {
    jobTitles: [],
    skills: [],
    yearsExperience: null,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  };

  console.log('Mock Resume Data:');
  console.log(JSON.stringify(mockResume3, null, 2));
  console.log('');

  try {
    const jobs3 = await searchJobs(mockResume3, 10);
    console.log(`✅ Found ${jobs3.length} jobs\n`);

    if (jobs3.length === 0) {
      console.log('⚠️ As expected, empty data returns no jobs');
      console.log('This means Claude might be returning empty/invalid data from user resumes\n');
    } else {
      console.log(`Fallback search worked - found ${jobs3.length} jobs\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n');

  // Test 4: Generic location (should search nationwide)
  console.log('TEST 4: Generic Location - "United States"');
  console.log('-------------------------------------------');

  const mockResume4: ParsedResume = {
    jobTitles: ['Marketing Manager'],
    skills: ['SEO', 'Content Marketing', 'Analytics'],
    yearsExperience: 3,
    location: 'United States', // Generic location - should NOT filter
    industries: ['Marketing'],
    education: "Bachelor's in Marketing",
    jobTypes: ['full-time'],
  };

  console.log('Mock Resume Data:');
  console.log(JSON.stringify(mockResume4, null, 2));
  console.log('');

  try {
    const jobs4 = await searchJobs(mockResume4, 10);
    console.log(`✅ Found ${jobs4.length} jobs (nationwide search)\n`);

    if (jobs4.length > 0) {
      console.log('Sample locations:');
      jobs4.slice(0, 5).forEach(job => {
        console.log(`  - ${job.location}`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n=== Tests Complete ===');
  console.log('\nConclusions:');
  console.log('- If TEST 1 works: Search logic is fine with good data');
  console.log('- If TEST 3 fails: Empty resume data is the problem');
  console.log('- If TEST 4 works: Nationwide search is working');
  console.log('\nNext step: Check what Claude is actually extracting from user resumes');
}

testResumeSearchFlow();
