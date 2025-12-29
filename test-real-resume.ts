/**
 * Test with real resume PDF
 */
import dotenv from 'dotenv';
import { parseResumePDF } from './lib/claude';
import { searchJobs } from './lib/job-search';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testRealResume() {
  console.log('🧪 Testing Real Resume Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Read the PDF
    console.log('\n1. Reading resume PDF...');
    const pdfPath = '/Users/leonliu/Desktop/Leon Resumes/Leon Liu Creative Resume _ Cover Letter.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`   ✓ PDF loaded (${pdfBuffer.length} bytes)`);

    // Step 2: Parse with Claude
    console.log('\n2. Parsing resume with Claude API...');
    const base64PDF = pdfBuffer.toString('base64');
    const parsedResume = await parseResumePDF(base64PDF);
    console.log('   ✓ Resume parsed successfully!');
    console.log('\n   Parsed Data:');
    console.log('   Job Titles:', parsedResume.jobTitles);
    console.log('   Location:', parsedResume.location);
    console.log('   Skills:', parsedResume.skills.slice(0, 5).join(', '), '...');
    console.log('   Years Experience:', parsedResume.yearsExperience);

    // Step 3: Search for jobs
    console.log('\n3. Searching for jobs with Serper API...');
    const jobs = await searchJobs(parsedResume, 25);

    console.log(`\n   ✓ Search completed!`);
    console.log(`   Found ${jobs.length} jobs\n`);

    if (jobs.length > 0) {
      console.log('📋 Sample Results:');
      console.log('='.repeat(60));

      jobs.slice(0, 5).forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   🏢 ${job.company}`);
        console.log(`   📍 ${job.location}`);
        console.log(`   🔖 Source: ${job.source}`);
        if (job.salary) {
          console.log(`   💰 ${job.salary}`);
        }
        console.log(`   🔗 ${job.url.substring(0, 60)}...`);
      });

      if (jobs.length > 5) {
        console.log(`\n... and ${jobs.length - 5} more jobs`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ TEST PASSED! Job search is working!');
      console.log(`\nThis means the deployed app should work too.`);
    } else {
      console.log('\n⚠️  WARNING: No jobs found!');
      console.log('This could mean:');
      console.log('  1. Serper API rate limit hit');
      console.log('  2. Query format issue');
      console.log('  3. No matching jobs for this profile');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes('Query not allowed')) {
      console.log('\n⚠️  Serper API Rate Limit Hit!');
      console.log('The free tier has been exceeded. Options:');
      console.log('  1. Wait for the limit to reset');
      console.log('  2. Upgrade Serper plan at https://serper.dev/');
    }
  }
}

testRealResume();
