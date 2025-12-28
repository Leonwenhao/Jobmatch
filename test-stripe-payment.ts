/**
 * Test script for Stripe payment integration
 * Run with: npx tsx test-stripe-payment.ts
 */

import dotenv from 'dotenv';
import { createCheckoutSession } from './lib/stripe';
import { randomUUID } from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Payment Integration\n');
  console.log('='.repeat(60));

  // Test 1: Check API credentials
  console.log('\n1. Checking Stripe API credentials...');
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('   ✗ STRIPE_SECRET_KEY not set!');
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('   ✗ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set!');
    process.exit(1);
  }

  const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`   ✓ Secret Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
  console.log(`   ✓ Publishable Key: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`);
  console.log(`   ✓ Mode: ${isTestMode ? 'TEST ✅' : 'LIVE ⚠️'}`);

  if (!isTestMode) {
    console.error('\n   ⚠️  WARNING: Using LIVE keys! Switch to test keys for development.');
    return;
  }

  // Test 2: Create a checkout session
  console.log('\n2. Testing checkout session creation...');
  const testSessionId = randomUUID();
  const testEmail = 'test@example.com';

  try {
    const checkoutUrl = await createCheckoutSession(testSessionId, testEmail);
    console.log('   ✓ Checkout session created successfully!');
    console.log(`   ✓ Session ID: ${testSessionId}`);
    console.log(`   ✓ Email: ${testEmail}`);
    console.log(`   ✓ Checkout URL: ${checkoutUrl.substring(0, 60)}...`);

    console.log('\n📋 Test Checkout Details:');
    console.log('='.repeat(60));
    console.log('Amount: $5.00 USD');
    console.log('Product: JobMatch - 25 Curated Job Postings');
    console.log('Customer Email:', testEmail);
    console.log('Metadata: sessionId =', testSessionId);

    console.log('\n💳 To test the payment:');
    console.log('1. Visit the checkout URL above');
    console.log('2. Use test card: 4242 4242 4242 4242');
    console.log('3. Use any future expiry date and any 3-digit CVC');
    console.log('4. Complete the payment');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Stripe integration test passed!');

    console.log('\n📝 Next Steps:');
    console.log('- Set up webhook testing with Stripe CLI:');
    console.log('  stripe listen --forward-to localhost:3000/api/webhook');
    console.log('- Start dev server: npm run dev');
    console.log('- Test full payment flow in browser');

  } catch (error) {
    console.error('   ✗ Failed to create checkout session');
    console.error('   Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test
testStripeIntegration().catch(console.error);
