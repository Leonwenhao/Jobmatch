import Stripe from 'stripe';

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
 */
export async function createCheckoutSession(
  sessionId: string,
  email: string
): Promise<string> {
  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create checkout session
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
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/cancel`,
  });

  if (!checkoutSession.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return checkoutSession.url;
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
