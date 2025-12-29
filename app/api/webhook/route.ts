import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { sessionStorage } from '@/lib/storage';
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

      // Get our session ID from metadata
      const sessionId = checkoutSession.metadata?.sessionId;

      if (!sessionId) {
        console.error('No sessionId in checkout session metadata');
        return NextResponse.json(
          { error: 'No session ID in metadata' },
          { status: 400 }
        );
      }

      // Get our session data from memory, or reconstruct from Stripe metadata
      let session = sessionStorage.get(sessionId);

      // If session not found in memory (serverless cold start), reconstruct from Stripe metadata
      if (!session) {
        console.log(`Session ${sessionId} not in memory, reconstructing from Stripe metadata`);

        const parsedResumeJson = checkoutSession.metadata?.parsedResume;
        const email = checkoutSession.customer_email || '';

        if (!parsedResumeJson) {
          console.error(`No parsedResume in Stripe metadata for session ${sessionId}`);
          return NextResponse.json(
            { error: 'Session data not found in Stripe metadata' },
            { status: 404 }
          );
        }

        try {
          const parsedResume: ParsedResume = JSON.parse(parsedResumeJson);

          // Create a new session from Stripe metadata
          session = {
            id: sessionId,
            email: email,
            resumeText: '', // Not needed for job search
            parsedResume: parsedResume,
            status: 'pending',
            createdAt: new Date(),
          };

          // Store the reconstructed session
          sessionStorage.set(sessionId, session);
          console.log(`Reconstructed session ${sessionId} from Stripe metadata`);
        } catch (parseError) {
          console.error(`Failed to parse parsedResume from Stripe metadata:`, parseError);
          return NextResponse.json(
            { error: 'Invalid session data in Stripe metadata' },
            { status: 500 }
          );
        }
      }

      console.log(`Processing payment for session ${sessionId}`);

      // Update session status to paid
      session.status = 'processing';
      sessionStorage.update(sessionId, session);

      try {
        // Resume is already parsed during upload, use the stored parsedResume
        if (!session.parsedResume) {
          throw new Error('No parsed resume found in session');
        }

        console.log(`Searching for jobs for session ${sessionId}`);

        // Search for jobs using parsed resume
        const jobs = await searchJobs(session.parsedResume, 25);

        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);

        // Update session with jobs
        session.jobs = jobs;
        sessionStorage.update(sessionId, session);

        // Send email with remaining 20 jobs (5 shown on results page, 20 via email)
        if (jobs.length > 5 && session.email) {
          const emailJobs = jobs.slice(5); // Get jobs 6-25
          console.log(`Sending ${emailJobs.length} jobs via email to ${session.email}`);

          try {
            const emailResult = await sendJobEmail(session.email, emailJobs);

            if (emailResult.success) {
              console.log(`Email sent successfully to ${session.email}, messageId: ${emailResult.messageId}`);
            } else {
              console.error(`Email delivery failed to ${session.email}:`, emailResult.error);
              // Don't fail the whole request if email fails
              // User still gets the 5 jobs on the results page
            }
          } catch (emailError) {
            console.error(`Email sending error:`, emailError);
            // Don't fail the whole request if email fails
          }
        } else if (jobs.length <= 5) {
          console.log(`Only ${jobs.length} jobs found, no email needed`);
        }

        // Mark session as complete
        session.status = 'complete';
        sessionStorage.update(sessionId, session);

        console.log(`Session ${sessionId} processing complete`);

        return NextResponse.json({ received: true }, { status: 200 });
      } catch (processingError) {
        console.error(`Error processing session ${sessionId}:`, processingError);

        // Mark session as failed
        session.status = 'failed';
        sessionStorage.update(sessionId, session);

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
