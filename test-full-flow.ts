/**
 * Full flow test: PDF parsing → Job search
 * Run with: npx tsx test-full-flow.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parseResumePDF } from './lib/claude';
import { searchJobs } from './lib/job-search';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RESUME_PATH = '/Users/leonliu/Desktop/Untitled document (2).pdf';

async function testFullFlow() {
  console.log('🧪 Full Flow Test: Resume PDF → Job Search\n');
  console.log('='.repeat(70));

  // Step 1: Read PDF file
  console.log('\n📄 Step 1: Reading PDF file...');
  if (!fs.existsSync(RESUME_PATH)) {
    console.error(`   ✗ File not found: ${RESUME_PATH}`);
    process.exit(1);
  }
  const pdfBuffer = fs.readFileSync(RESUME_PATH);
  const base64PDF = pdfBuffer.toString('base64');
  console.log(`   ✓ PDF loaded (${Math.round(pdfBuffer.length / 1024)}KB)`);

  // Step 2: Parse resume with Claude
  console.log('\n🤖 Step 2: Parsing resume with Claude API...');
  try {
    const parsedResume = await parseResumePDF(base64PDF);
    console.log('   ✓ Resume parsed successfully!\n');

    console.log('   📋 Parsed Resume Data:');
    console.log('   ' + '-'.repeat(50));
    console.log(`   Job Titles: ${parsedResume.jobTitles.join(', ')}`);
    console.log(`   Location: ${parsedResume.location}`);
    console.log(`   Years Experience: ${parsedResume.yearsExperience}`);
    console.log(`   Skills: ${parsedResume.skills.slice(0, 5).join(', ')}${parsedResume.skills.length > 5 ? '...' : ''}`);
    console.log(`   Industries: ${parsedResume.industries.join(', ')}`);
    console.log(`   Education: ${parsedResume.education}`);
    console.log(`   Job Types: ${parsedResume.jobTypes.join(', ')}`);

    // Step 3: Search for jobs
    console.log('\n🔍 Step 3: Searching for jobs with Google Custom Search...');
    console.log(`   Searching for: ${parsedResume.jobTitles.slice(0, 3).join(', ')}`);
    console.log(`   Location: ${parsedResume.location}`);

    const jobs = await searchJobs(parsedResume, 25);

    console.log(`\n   ✓ Found ${jobs.length} jobs!\n`);

    if (jobs.length > 0) {
      console.log('📋 Job Results:');
      console.log('='.repeat(70));

      // Show all jobs
      jobs.forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   🏢 Company: ${job.company}`);
        console.log(`   📍 Location: ${job.location}`);
        console.log(`   📌 Source: ${job.source}`);
        if (job.salary) {
          console.log(`   💰 Salary: ${job.salary}`);
        }
        console.log(`   🔗 URL: ${job.url}`);
      });

      // Summary
      console.log('\n' + '='.repeat(70));
      console.log('\n📊 Summary:');
      console.log(`   Total jobs found: ${jobs.length}`);

      // Count by source
      const sourceCounts: Record<string, number> = {};
      jobs.forEach(job => {
        sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
      });
      console.log('   Jobs by source:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`     - ${source}: ${count}`);
      });

      console.log('\n✅ Full flow test PASSED!');
    } else {
      console.log('\n⚠️  No jobs found. This could be due to:');
      console.log('   - Very specific job titles');
      console.log('   - Location constraints');
      console.log('   - API quota limits');
    }

  } catch (error) {
    console.error('   ✗ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testFullFlow().catch(console.error);
