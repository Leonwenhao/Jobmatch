import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '@/lib/storage';
import { findCheckoutSessionBySessionId } from '@/lib/stripe';
import { searchJobs } from '@/lib/job-search';
import { sendJobEmail } from '@/lib/resend';

/**
 * GET /api/results/[sessionId]
 * Fetch job results for a session
 * If session not in memory, reconstructs from Stripe and runs job search
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session data from Redis
    let session = await getSession(sessionId);

    // FALLBACK FIX: If session exists but has no jobs, run the job search now
    if (session && (!session.jobs || session.jobs.length === 0) && session.parsedResume) {
      console.log(`Session ${sessionId} found but has no jobs - running job search now...`);

      try {
        const jobs = await searchJobs(session.parsedResume, 25);
        console.log(`Fallback search found ${jobs.length} jobs for session ${sessionId}`);

        session.jobs = jobs;
        session.status = 'complete';
        await setSession(sessionId, session);

        // Send email with ALL jobs as receipt/backup (only if not already sent)
        if (jobs.length > 0 && session.email && !session.emailSent) {
          console.log(`Sending all ${jobs.length} jobs via email to ${session.email} as receipt (fallback)`);
          try {
            const emailResult = await sendJobEmail(session.email, jobs);
            if (emailResult.success) {
              console.log(`Email receipt sent successfully to ${session.email}`);
              session.emailSent = true;
              await setSession(sessionId, session); // Update emailSent flag
            } else {
              console.error(`Email delivery failed:`, emailResult.error);
            }
          } catch (emailError) {
            console.error(`Email sending error:`, emailError);
          }
        } else if (session.emailSent) {
          console.log(`Email already sent for session ${sessionId}, skipping duplicate`);
        } else if (!session.email) {
          console.warn(`No email address for session ${sessionId} - skipping email`);
        }
      } catch (searchError) {
        console.error(`Fallback search failed for ${sessionId}:`, searchError);
        // Continue anyway - will return empty jobs
      }
    }

    // If session not in Redis, try Stripe metadata as backup
    if (!session) {
      console.log(`Session ${sessionId} not in Redis, checking Stripe...`);

      const stripeData = await findCheckoutSessionBySessionId(sessionId);

      if (!stripeData) {
        return NextResponse.json(
          { error: 'Session not found or expired. Please try uploading your resume again.' },
          { status: 404 }
        );
      }

      console.log(`Found Stripe session for ${sessionId}, running job search...`);

      try {
        const jobs = await searchJobs(stripeData.parsedResume, 25);

        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);

        session = {
          id: sessionId,
          email: stripeData.email,
          resumeText: '',
          parsedResume: stripeData.parsedResume,
          jobs: jobs,
          status: 'complete',
          createdAt: new Date(),
        };

        // Store in Redis for future requests
        await setSession(sessionId, session);

        // Send email with ALL jobs as receipt/backup
        if (jobs.length > 0 && stripeData.email) {
          console.log(`Sending all ${jobs.length} jobs via email to ${stripeData.email} as receipt (Stripe fallback)`);

          try {
            const emailResult = await sendJobEmail(stripeData.email, jobs);
            if (emailResult.success) {
              console.log(`Email receipt sent successfully to ${stripeData.email}`);
              session.emailSent = true;
              await setSession(sessionId, session); // Update emailSent flag
            } else {
              console.error(`Email delivery failed:`, emailResult.error);
            }
          } catch (emailError) {
            console.error(`Email sending error:`, emailError);
          }
        } else if (!stripeData.email) {
          console.warn(`No email address from Stripe for session ${sessionId} - skipping email`);
        }

      } catch (searchError) {
        console.error(`Error searching jobs for ${sessionId}:`, searchError);
        return NextResponse.json(
          { error: 'Failed to search for jobs. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Return session status and ALL jobs (user sees all 25 on results page)
    return NextResponse.json({
      status: session.status,
      jobs: session.jobs || [], // Return ALL jobs for results page
      email: session.email,
      totalJobs: session.jobs?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
