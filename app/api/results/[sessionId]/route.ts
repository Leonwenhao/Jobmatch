import { NextRequest, NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';
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

    // Get session data from memory
    let session = sessionStorage.get(sessionId);

    // If session not found in memory (serverless cold start), try to reconstruct from Stripe
    if (!session) {
      console.log(`Session ${sessionId} not in memory, checking Stripe...`);

      const stripeData = await findCheckoutSessionBySessionId(sessionId);

      if (!stripeData) {
        // No paid session found in Stripe
        return NextResponse.json(
          { error: 'Session not found or expired. Please try uploading your resume again.' },
          { status: 404 }
        );
      }

      console.log(`Found Stripe session for ${sessionId}, running job search...`);

      // Reconstruct session and run job search
      try {
        const jobs = await searchJobs(stripeData.parsedResume, 25);

        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);

        // Create session with results
        session = {
          id: sessionId,
          email: stripeData.email,
          resumeText: '',
          parsedResume: stripeData.parsedResume,
          jobs: jobs,
          status: 'complete',
          createdAt: new Date(),
        };

        // Store for future requests
        sessionStorage.set(sessionId, session);

        // Send email with remaining jobs if not already sent
        // (We check this by seeing if we just created the session)
        if (jobs.length > 5 && stripeData.email) {
          const emailJobs = jobs.slice(5);
          console.log(`Sending ${emailJobs.length} jobs via email to ${stripeData.email}`);

          try {
            const emailResult = await sendJobEmail(stripeData.email, emailJobs);
            if (emailResult.success) {
              console.log(`Email sent successfully to ${stripeData.email}`);
            } else {
              console.error(`Email delivery failed:`, emailResult.error);
            }
          } catch (emailError) {
            console.error(`Email sending error:`, emailError);
          }
        }

      } catch (searchError) {
        console.error(`Error searching jobs for ${sessionId}:`, searchError);
        return NextResponse.json(
          { error: 'Failed to search for jobs. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Return session status and jobs
    return NextResponse.json({
      status: session.status,
      jobs: session.jobs?.slice(0, 5) || [], // Return first 5 jobs for results page
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
