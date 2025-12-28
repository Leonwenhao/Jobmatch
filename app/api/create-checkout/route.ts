import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { sessionStorage } from '@/lib/storage';
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

    // Verify session exists
    if (!sessionStorage.has(sessionId)) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Update session with email
    const session = sessionStorage.get(sessionId);
    if (session) {
      session.email = email;
      sessionStorage.update(sessionId, session);
    }

    // Create Stripe checkout session
    const checkoutUrl = await createCheckoutSession(sessionId, email);

    // Return checkout URL
    const response: CheckoutResponse = {
      checkoutUrl,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
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
