import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';

/**
 * GET /api/get-session?checkout_session_id=xxx
 * Retrieves our internal session ID from Stripe checkout session metadata
 * This is more reliable than localStorage
 */
export async function GET(request: NextRequest) {
  try {
    const checkoutSessionId = request.nextUrl.searchParams.get('checkout_session_id');

    if (!checkoutSessionId) {
      return NextResponse.json(
        { error: 'checkout_session_id is required' },
        { status: 400 }
      );
    }

    // Get the Stripe checkout session
    const checkoutSession = await getCheckoutSession(checkoutSessionId);

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get our session ID from metadata
    const sessionId = checkoutSession.metadata?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID not found in checkout metadata' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId,
      email: checkoutSession.customer_email,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
