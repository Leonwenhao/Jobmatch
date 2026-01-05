import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { getSession, setSession, updateSession } from '@/lib/storage';
import { searchJobs } from '@/lib/job-search';
import { sendJobEmail } from '@/lib/resend';
import { ParsedResume, Session } from '@/lib/types';
import Stripe from 'stripe';

/**
 * POST /api/webhook
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const stripeEventId = event.id; // For idempotency

      // Get our session ID from metadata
      const sessionId = checkoutSession.metadata?.sessionId;

      if (!sessionId) {
        console.error('No sessionId in checkout session metadata');
        return NextResponse.json(
          { error: 'No session ID in metadata' },
          { status: 400 }
        );
      }

      // Get session from Redis
      let session = await getSession(sessionId);

      // If session not in Redis, try to reconstruct from Stripe metadata (backup)
      if (!session) {
        console.log(`Session ${sessionId} not in Redis, trying Stripe metadata fallback`);

        const parsedResumeJson = checkoutSession.metadata?.parsedResume;
        const email = checkoutSession.customer_email || '';

        if (!parsedResumeJson) {
          console.error(`Session ${sessionId} not found in Redis or Stripe metadata`);
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        try {
          const parsedResume: ParsedResume = JSON.parse(parsedResumeJson);

          session = {
            id: sessionId,
            email: email,
            resumeText: '',
            parsedResume: parsedResume,
            status: 'pending',
            createdAt: new Date(),
          };

          await setSession(sessionId, session);
          console.log(`Reconstructed session ${sessionId} from Stripe metadata`);
        } catch (parseError) {
          console.error(`Failed to parse Stripe metadata:`, parseError);
          return NextResponse.json(
            { error: 'Invalid session data' },
            { status: 500 }
          );
        }
      }

      console.log(`Processing payment for session ${sessionId}`);

      // Idempotency check: skip if this Stripe event was already processed
      if (session.stripeEventId === stripeEventId) {
        console.log(`Stripe event ${stripeEventId} already processed for session ${sessionId}, skipping`);
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Also skip if session is already complete (another safeguard)
      if (session.status === 'complete' && session.jobs && session.jobs.length > 0) {
        console.log(`Session ${sessionId} already complete with ${session.jobs.length} jobs, skipping`);
        return NextResponse.json({ received: true, alreadyComplete: true }, { status: 200 });
      }

      // Update session status to processing and store event ID for idempotency
      session.status = 'processing';
      session.stripeEventId = stripeEventId;
      await updateSession(sessionId, session);

      try {
        // Resume is already parsed during upload, use the stored parsedResume
        if (!session.parsedResume) {
          throw new Error('No parsed resume found in session');
        }

        // CRITICAL LOGGING: Track parsedResume data to diagnose search issues
        console.log('=== PARSED RESUME DEBUG ===');
        console.log(`Session ${sessionId} parsedResume:`, JSON.stringify(session.parsedResume, null, 2));
        console.log(`Job titles count: ${session.parsedResume.jobTitles?.length || 0}`);
        console.log(`Job titles: ${JSON.stringify(session.parsedResume.jobTitles)}`);
        console.log(`Skills count: ${session.parsedResume.skills?.length || 0}`);
        console.log(`Location: ${session.parsedResume.location || 'not set'}`);

        // Warn if jobTitles is empty (this is the root cause of "No matches found")
        if (!session.parsedResume.jobTitles || session.parsedResume.jobTitles.length === 0) {
          console.warn('⚠️ WARNING: parsedResume has no job titles - fallback search will be used');
        }

        console.log(`Searching for jobs for session ${sessionId}`);

        // Search for jobs using parsed resume
        const jobs = await searchJobs(session.parsedResume, 25);

        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);

        // Update session with jobs
        session.jobs = jobs;
        await updateSession(sessionId, session);

        // Send email with ALL jobs as receipt/backup (user sees all on results page too)
        // Check emailSent flag to prevent duplicate emails
        if (jobs.length > 0 && session.email && !session.emailSent) {
          console.log(`Sending all ${jobs.length} jobs via email to ${session.email} as receipt`);

          try {
            const emailResult = await sendJobEmail(session.email, jobs);

            if (emailResult.success) {
              console.log(`Email receipt sent successfully to ${session.email}, messageId: ${emailResult.messageId}`);
              session.emailSent = true; // Mark as sent to prevent duplicates
              await updateSession(sessionId, { emailSent: true });
            } else {
              console.error(`Email delivery failed to ${session.email}:`, emailResult.error);
              // Don't fail the whole request if email fails
              // User still sees all jobs on the results page
            }
          } catch (emailError) {
            console.error(`Email sending error:`, emailError);
            // Don't fail the whole request if email fails
          }
        } else if (session.emailSent) {
          console.log(`Email already sent for session ${session.id}, skipping duplicate`);
        } else if (jobs.length === 0) {
          console.warn(`No jobs found for session ${session.id} - no email to send`);
        } else if (!session.email) {
          console.warn(`No email address for session ${session.id} - skipping email`);
        }

        // Mark session as complete
        session.status = 'complete';
        await updateSession(sessionId, session);

        console.log(`Session ${sessionId} processing complete`);

        return NextResponse.json({ received: true }, { status: 200 });
      } catch (processingError) {
        console.error(`Error processing session ${sessionId}:`, processingError);

        // Mark session as failed
        session.status = 'failed';
        await updateSession(sessionId, session);

        return NextResponse.json(
          { error: 'Processing failed' },
          { status: 500 }
        );
      }
    }

    // Return 200 for other event types
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - not supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
