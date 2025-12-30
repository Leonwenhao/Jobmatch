import { NextRequest, NextResponse } from 'next/server';
import { searchJobs, buildSearchQuery, extractLocation } from '@/lib/job-search';
import { ParsedResume } from '@/lib/types';
import { getSession } from '@/lib/storage';

/**
 * Debug endpoint for testing the job search pipeline
 * GET /api/debug-search?sessionId=xxx - test with existing session
 * POST /api/debug-search - test with provided parsedResume data
 */

// Test resume for debugging
const TEST_RESUME: ParsedResume = {
  jobTitles: ['Software Engineer', 'Full Stack Developer', 'Backend Engineer'],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
  yearsExperience: 5,
  location: 'San Francisco, CA',
  industries: ['Technology', 'SaaS'],
  education: "Bachelor's in Computer Science",
  jobTypes: ['full-time', 'remote'],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const useTestData = searchParams.get('test') === 'true';

  const debugLog: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    debugLog.push(msg);
  };

  log('=== DEBUG SEARCH ENDPOINT ===');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`Session ID: ${sessionId || 'not provided'}`);
  log(`Use test data: ${useTestData}`);

  let parsedResume: ParsedResume;

  if (sessionId && !useTestData) {
    log('\n--- Step 1: Fetching session from Redis ---');
    const session = await getSession(sessionId);

    if (!session) {
      log('❌ Session not found in Redis');
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        debugLog,
      }, { status: 404 });
    }

    log(`✅ Session found: status=${session.status}`);
    log(`Email: ${session.email || 'not set'}`);
    log(`Has parsedResume: ${!!session.parsedResume}`);

    if (!session.parsedResume) {
      log('❌ No parsedResume in session');
      return NextResponse.json({
        success: false,
        error: 'No parsedResume in session',
        session: {
          id: session.id,
          status: session.status,
          email: session.email,
          hasParsedResume: false,
        },
        debugLog,
      }, { status: 400 });
    }

    parsedResume = session.parsedResume;
  } else {
    log('\n--- Using test resume data ---');
    parsedResume = TEST_RESUME;
  }

  log('\n--- Step 2: Analyzing parsedResume ---');
  log(`Job Titles: ${JSON.stringify(parsedResume.jobTitles)}`);
  log(`Location: ${parsedResume.location || 'null'}`);
  log(`Skills: ${JSON.stringify(parsedResume.skills)}`);
  log(`Years Experience: ${parsedResume.yearsExperience}`);
  log(`Industries: ${JSON.stringify(parsedResume.industries)}`);
  log(`Education: ${parsedResume.education || 'null'}`);
  log(`Job Types: ${JSON.stringify(parsedResume.jobTypes)}`);

  // Check: do we have job titles?
  if (!parsedResume.jobTitles || parsedResume.jobTitles.length === 0) {
    log('\n⚠️ WARNING: No job titles in parsedResume');
    log('Fallback search logic will be used based on skills/industries');
    // Continue to test fallback logic instead of failing immediately
  } else {
    log(`\n✅ Found ${parsedResume.jobTitles.length} job titles`);
  }

  log('\n--- Step 3: Building search queries ---');
  const location = extractLocation(parsedResume);
  const queries = parsedResume.jobTitles.slice(0, 3).map(title => {
    const query = buildSearchQuery(title, location);
    log(`Query for "${title}": ${query}`);
    log(`Query length: ${query.length} chars`);
    return query;
  });

  log('\n--- Step 4: Executing job search ---');
  try {
    const startTime = Date.now();
    const jobs = await searchJobs(parsedResume, 25);
    const duration = Date.now() - startTime;

    log(`\n✅ Search completed in ${duration}ms`);
    log(`Found ${jobs.length} jobs`);

    if (jobs.length === 0) {
      log('\n⚠️ WARNING: Search returned 0 jobs');
      log('Possible causes:');
      log('  1. Job titles too specific/niche');
      log('  2. Location too restrictive');
      log('  3. Google CSE quota exceeded');
      log('  4. Network/API errors (check logs above)');
    } else {
      log('\n--- Sample Results ---');
      jobs.slice(0, 3).forEach((job, i) => {
        log(`\n${i + 1}. ${job.title} at ${job.company}`);
        log(`   Location: ${job.location}`);
        log(`   URL: ${job.url}`);
        log(`   Source: ${job.source}`);
      });
    }

    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      jobs: jobs.slice(0, 5), // Return first 5 for debugging
      parsedResume,
      queries,
      debugLog,
    });

  } catch (error) {
    log(`\n❌ Search error: ${error instanceof Error ? error.message : String(error)}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown search error',
      parsedResume,
      queries,
      debugLog,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const debugLog: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    debugLog.push(msg);
  };

  try {
    const body = await request.json();
    const parsedResume: ParsedResume = body.parsedResume || TEST_RESUME;

    log('=== DEBUG SEARCH (POST) ===');
    log(`Using custom parsedResume: ${!!body.parsedResume}`);

    log('\n--- Parsed Resume ---');
    log(JSON.stringify(parsedResume, null, 2));

    if (!parsedResume.jobTitles || parsedResume.jobTitles.length === 0) {
      log('⚠️ No job titles - testing fallback search logic');
    }

    log('\n--- Executing search ---');
    const jobs = await searchJobs(parsedResume, 25);

    log(`\nFound ${jobs.length} jobs`);

    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      jobs,
      parsedResume,
      debugLog,
    });

  } catch (error) {
    log(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debugLog,
    }, { status: 500 });
  }
}
