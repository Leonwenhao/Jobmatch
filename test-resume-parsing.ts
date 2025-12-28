/**
 * Test script for resume parsing functionality
 * Run with: npx tsx test-resume-parsing.ts
 */

import dotenv from 'dotenv';
import { parseResume, validateResumeText } from './lib/claude';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Debug: Check if API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set!');
  process.exit(1);
}
console.log(`✓ API Key loaded: ${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...`);

const sampleResume = `
JOHN DOE
San Francisco, CA | john.doe@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5 years of experience in full-stack web development.
Passionate about building scalable applications and mentoring junior developers.

WORK EXPERIENCE

Senior Software Engineer | Tech Corp | Jan 2021 - Present
- Lead development of microservices architecture using Node.js and React
- Mentor team of 3 junior developers
- Implement CI/CD pipelines reducing deployment time by 40%

Software Engineer | StartupXYZ | Jun 2019 - Dec 2020
- Built RESTful APIs using Python and FastAPI
- Developed responsive web applications with React and TypeScript
- Collaborated with product team to define technical requirements

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2015 - 2019

SKILLS
Technical: JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, MongoDB, AWS
Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration

JOB PREFERENCES
Open to: Full-time, Remote positions
Industries: Technology, SaaS, Fintech
`;

async function testParsing() {
  console.log('🧪 Testing Resume Parsing\n');
  console.log('='.repeat(60));

  // Test 1: Validate resume text
  console.log('\n1. Testing validation...');
  const validation = validateResumeText(sampleResume);
  console.log(`   ✓ Validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
  if (!validation.valid) {
    console.log(`   Error: ${validation.error}`);
    return;
  }

  // Test 2: Parse resume
  console.log('\n2. Testing Claude API parsing...');
  try {
    const parsed = await parseResume(sampleResume);
    console.log('   ✓ Parsing: SUCCESS\n');

    console.log('📋 Parsed Resume Data:');
    console.log('='.repeat(60));
    console.log('\n📝 Job Titles:', parsed.jobTitles);
    console.log('🛠️  Skills:', parsed.skills.slice(0, 10), '...'); // Show first 10
    console.log('📅 Years Experience:', parsed.yearsExperience);
    console.log('📍 Location:', parsed.location);
    console.log('🏢 Industries:', parsed.industries);
    console.log('🎓 Education:', parsed.education);
    console.log('💼 Job Types:', parsed.jobTypes);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('   ✗ Parsing: FAILED');
    console.error('   Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Test 3: Empty resume
async function testEmptyResume() {
  console.log('\n\n3. Testing empty resume validation...');
  const validation = validateResumeText('   ');
  console.log(`   ✓ Empty resume rejected: ${!validation.valid ? 'PASSED' : 'FAILED'}`);
  if (!validation.valid) {
    console.log(`   Expected error: "${validation.error}"`);
  }
}

// Test 4: Short resume
async function testShortResume() {
  console.log('\n4. Testing short resume validation...');
  const validation = validateResumeText('Hi');
  console.log(`   ✓ Short resume rejected: ${!validation.valid ? 'PASSED' : 'FAILED'}`);
  if (!validation.valid) {
    console.log(`   Expected error: "${validation.error}"`);
  }
}

// Run all tests
async function runTests() {
  await testParsing();
  await testEmptyResume();
  await testShortResume();
  console.log('\n🎉 Test suite completed!\n');
}

runTests().catch(console.error);
