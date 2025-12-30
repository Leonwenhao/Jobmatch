/**
 * Test edge cases that might cause "No matches found"
 * Run with: npx tsx scripts/test-edge-cases.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ParsedResume } from '../lib/types';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = 'http://localhost:3000';

interface DebugResponse {
  success: boolean;
  jobCount?: number;
  error?: string;
  parsedResume?: ParsedResume;
  debugLog?: string[];
}

async function testSearchWithResume(name: string, resume: ParsedResume): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log(`TEST: ${name}`);
  console.log('='.repeat(60));
  console.log('Job Titles:', resume.jobTitles);
  console.log('Location:', resume.location);

  try {
    const response = await fetch(`${BASE_URL}/api/debug-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsedResume: resume }),
    });

    const data: DebugResponse = await response.json();

    if (data.success) {
      console.log(`\n✅ SUCCESS: Found ${data.jobCount} jobs`);
    } else {
      console.log(`\n❌ FAILED: ${data.error}`);
    }

  } catch (error) {
    console.log(`\n❌ ERROR: ${error}`);
  }
}

async function main() {
  console.log('🧪 Edge Case Testing for Job Search\n');

  // Test 1: Empty job titles with skills (tests fallback logic)
  await testSearchWithResume('Empty Job Titles with Skills (should use fallback)', {
    jobTitles: [],
    skills: ['JavaScript', 'Python', 'React', 'Node.js'],
    yearsExperience: 5,
    location: 'San Francisco, CA',
    industries: ['Technology'],
    education: "Bachelor's in CS",
    jobTypes: ['full-time'],
  });

  // Test 2: No location
  await testSearchWithResume('No Location', {
    jobTitles: ['Software Engineer'],
    skills: ['JavaScript'],
    yearsExperience: 3,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  });

  // Test 3: Very specific job title
  await testSearchWithResume('Very Specific Job Title', {
    jobTitles: ['Senior Principal Staff Machine Learning Infrastructure Engineer III'],
    skills: [],
    yearsExperience: 10,
    location: 'Palo Alto, CA',
    industries: [],
    education: null,
    jobTypes: [],
  });

  // Test 4: Non-tech job title
  await testSearchWithResume('Non-Tech Job Title', {
    jobTitles: ['Registered Nurse', 'Nurse Practitioner'],
    skills: ['Patient Care', 'Medical Records'],
    yearsExperience: 8,
    location: 'Chicago, IL',
    industries: ['Healthcare'],
    education: 'BSN',
    jobTypes: ['full-time'],
  });

  // Test 5: Unusual location format
  await testSearchWithResume('Unusual Location Format', {
    jobTitles: ['Product Manager'],
    skills: [],
    yearsExperience: 5,
    location: 'Remote - US', // Might not match searches
    industries: [],
    education: null,
    jobTypes: ['remote'],
  });

  // Test 6: International location
  await testSearchWithResume('International Location', {
    jobTitles: ['Data Scientist'],
    skills: [],
    yearsExperience: 4,
    location: 'London, UK', // Non-US location
    industries: [],
    education: null,
    jobTypes: [],
  });

  // Test 7: Empty everything
  await testSearchWithResume('Completely Empty Resume', {
    jobTitles: [],
    skills: [],
    yearsExperience: null,
    location: null,
    industries: [],
    education: null,
    jobTypes: [],
  });

  // Test 8: Job title with special characters
  await testSearchWithResume('Special Characters in Title', {
    jobTitles: ['C++ Developer', 'C# Engineer'],
    skills: ['C++', 'C#'],
    yearsExperience: 5,
    location: 'Austin, TX',
    industries: [],
    education: null,
    jobTypes: [],
  });

  console.log('\n\n📋 ANALYSIS');
  console.log('='.repeat(60));
  console.log('If "Empty Job Titles" test fails, the issue is:');
  console.log('  → Resume parsing is not extracting job titles');
  console.log('');
  console.log('If specific/unusual job titles fail but common ones work:');
  console.log('  → The job boards dont have those positions');
  console.log('  → Consider adding fallback to broader search terms');
  console.log('');
  console.log('If non-US locations fail:');
  console.log('  → The job boards are US-focused');
  console.log('  → Consider removing location restriction for international users');
}

main().catch(console.error);
