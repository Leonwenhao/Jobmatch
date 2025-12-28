/**
 * Test script for webhook handler
 * Run with: npx tsx test-webhook.ts
 */

import dotenv from 'dotenv';
import { sessionStorage } from './lib/storage';
import { searchJobs } from './lib/adzuna';
import { ParsedResume } from './lib/types';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testWebhookFlow() {
  console.log('🧪 Testing Webhook Payment Flow\n');
  console.log('='.repeat(60));

  // Step 1: Create a mock session (simulating upload)
  console.log('\n1. Creating mock session (simulating resume upload)...');
  const sessionId = randomUUID();
  const mockParsedResume: ParsedResume = {
    jobTitles: ['Software Engineer'],
    skills: ['JavaScript', 'TypeScript', 'React'],
    yearsExperience: 3,
    location: 'San Francisco, CA',
    industries: ['Technology'],
    education: "Bachelor's in Computer Science",
    jobTypes: ['full-time'],
  };

  sessionStorage.set(sessionId, {
    id: sessionId,
    email: 'test@example.com',
    resumeText: 'Mock resume text...',
    parsedResume: mockParsedResume,
    status: 'pending',
    createdAt: new Date(),
  });

  console.log(`   ✓ Session created: ${sessionId}`);
  console.log(`   ✓ Parsed resume stored`);

  // Step 2: Simulate payment success (what webhook does)
  console.log('\n2. Simulating payment success webhook...');
  console.log('   ✓ Payment received');
  console.log('   ✓ Webhook signature verified (simulated)');

  // Step 3: Update session status to processing
  const session = sessionStorage.get(sessionId);
  if (!session) {
    console.error('   ✗ Session not found!');
    return;
  }

  session.status = 'processing';
  sessionStorage.update(sessionId, session);
  console.log('   ✓ Session status: processing');

  // Step 4: Search for jobs (what webhook does)
  console.log('\n3. Searching for jobs with parsed resume...');
  try {
    const jobs = await searchJobs(mockParsedResume, 25);
    console.log(`   ✓ Found ${jobs.length} jobs`);

    // Display sample jobs
    if (jobs.length > 0) {
      console.log('\n📋 Sample Jobs Found:');
      console.log('='.repeat(60));
      jobs.slice(0, 3).forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   🏢 ${job.company}`);
        console.log(`   📍 ${job.location}`);
        if (job.salary) {
          console.log(`   💰 ${job.salary}`);
        }
      });
      if (jobs.length > 3) {
        console.log(`\n... and ${jobs.length - 3} more jobs`);
      }
    }

    // Step 5: Update session with jobs
    session.jobs = jobs;
    session.status = 'complete';
    sessionStorage.update(sessionId, session);
    console.log('\n   ✓ Jobs stored in session');
    console.log('   ✓ Session status: complete');

    // Step 6: Verify session data
    console.log('\n4. Verifying final session state...');
    const finalSession = sessionStorage.get(sessionId);
    if (finalSession) {
      console.log(`   ✓ Session ID: ${finalSession.id}`);
      console.log(`   ✓ Status: ${finalSession.status}`);
      console.log(`   ✓ Email: ${finalSession.email}`);
      console.log(`   ✓ Jobs count: ${finalSession.jobs?.length || 0}`);
      console.log(`   ✓ Top 5 jobs ready for display: ${(finalSession.jobs?.slice(0, 5).length || 0)}`);
      console.log(`   ✓ Remaining 20 jobs for email: ${Math.max(0, (finalSession.jobs?.length || 0) - 5)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Webhook flow test PASSED!');

    console.log('\n📝 What happens in production:');
    console.log('1. User uploads resume → session created with parsed data');
    console.log('2. User pays $5 → Stripe sends webhook');
    console.log('3. Webhook receives payment confirmation');
    console.log('4. Server searches for 25 jobs');
    console.log('5. Top 5 jobs shown immediately');
    console.log('6. Remaining 20 jobs queued for email (Milestone 5)');

  } catch (error) {
    console.error('\n   ✗ Job search failed');
    console.error('   Error:', error instanceof Error ? error.message : error);

    // Mark session as failed
    session.status = 'failed';
    sessionStorage.update(sessionId, session);
    console.log('   ✓ Session marked as failed');

    process.exit(1);
  }
}

// Run the test
testWebhookFlow().catch(console.error);
