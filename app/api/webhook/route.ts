import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { sessionStorage } from '@/lib/storage';
import { searchJobs } from '@/lib/adzuna';
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

      // Get our session data
      const session = sessionStorage.get(sessionId);

      if (!session) {
        console.error(`Session ${sessionId} not found`);
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
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

        // Update session with jobs and mark complete
        session.jobs = jobs;
        session.status = 'complete';
        sessionStorage.update(sessionId, session);

        // TODO: In Milestone 5, send email with remaining 20 jobs
        // For now, we just store all 25 jobs in the session

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
