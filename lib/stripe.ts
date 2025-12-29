import Stripe from 'stripe';
import { ParsedResume } from './types';

// Lazy initialization of Stripe client
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeClient;
}

/**
 * Create a Stripe Checkout session for job search payment
 * Stores parsedResume in metadata to survive serverless function restarts
 */
export async function createCheckoutSession(
  sessionId: string,
  email: string,
  parsedResume?: ParsedResume
): Promise<string> {
  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured. Please set it in Vercel environment variables.');
  }

  console.log(`Creating Stripe checkout session for ${email}, appUrl: ${appUrl}`);

  // Create checkout session
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'JobMatch - 25 Curated Job Postings',
            description: 'Get 25 jobs matched to your resume (5 instantly, 20 via email)',
          },
          unit_amount: 500, // $5.00 in cents
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    metadata: {
      sessionId: sessionId, // Pass our session ID for correlation
      // Store parsedResume as JSON for serverless persistence
      // Stripe metadata values are limited to 500 chars, so we encode it
      parsedResume: parsedResume ? JSON.stringify(parsedResume) : '',
    },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
    });

    if (!checkoutSession.url) {
      throw new Error('Stripe did not return a checkout URL. Please check your Stripe configuration.');
    }

    console.log(`Stripe checkout session created: ${checkoutSession.id}`);
    return checkoutSession.url;
  } catch (error: any) {
    console.error('Stripe API error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Stripe configuration error: ${error.message}`);
    }

    if (error.type === 'StripeAuthenticationError') {
      throw new Error('Stripe authentication failed. Check your STRIPE_SECRET_KEY.');
    }

    // Re-throw with more context
    throw new Error(`Stripe error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(
  checkoutSessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  return await stripe.checkout.sessions.retrieve(checkoutSessionId);
}

/**
 * Find a completed checkout session by our sessionId in metadata
 * Returns the parsedResume if found
 */
export async function findCheckoutSessionBySessionId(
  sessionId: string
): Promise<{ parsedResume: ParsedResume; email: string } | null> {
  const stripe = getStripeClient();

  try {
    // List recent checkout sessions and find one with matching sessionId
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Check last 100 sessions
    });

    for (const session of sessions.data) {
      if (session.metadata?.sessionId === sessionId && session.payment_status === 'paid') {
        const parsedResumeJson = session.metadata?.parsedResume;
        if (parsedResumeJson) {
          return {
            parsedResume: JSON.parse(parsedResumeJson),
            email: session.customer_email || '',
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding checkout session by sessionId:', error);
    return null;
  }
}
