import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getSession, updateSession, hasSession } from '@/lib/storage';
import { CheckoutRequest, CheckoutResponse } from '@/lib/types';

/**
 * POST /api/create-checkout
 * Creates a Stripe Checkout session for payment
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CheckoutRequest = await request.json();
    const { sessionId, email } = body;

    // Validate required fields
    if (!sessionId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Verify session exists and get it from Redis
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Update session with email
    session.email = email;
    await updateSession(sessionId, session);

    // Get parsedResume to pass to Stripe (as backup)
    const parsedResume = session.parsedResume;

    // Create Stripe checkout session
    let checkoutUrl: string;
    try {
      checkoutUrl = await createCheckoutSession(sessionId, email, parsedResume);
    } catch (stripeError) {
      console.error('Stripe checkout creation error:', stripeError);

      // Return more specific error message
      const errorMessage = stripeError instanceof Error
        ? stripeError.message
        : 'Unknown Stripe error';

      return NextResponse.json(
        {
          error: `Stripe error: ${errorMessage}`,
          details: 'Check that STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL are set in Vercel environment variables'
        },
        { status: 500 }
      );
    }

    // Return checkout URL
    const response: CheckoutResponse = {
      checkoutUrl,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Checkout creation error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to create checkout session';

    return NextResponse.json(
      { error: errorMessage },
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
