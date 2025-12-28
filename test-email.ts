import dotenv from 'dotenv';
import { sendTestEmail } from './lib/resend';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * Test email delivery with Resend
 *
 * Usage: npx tsx test-email.ts <email-address>
 */

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx test-email.ts <email-address>');
    console.error('Example: npx tsx test-email.ts user@example.com');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email address format');
    process.exit(1);
  }

  console.log('Testing email delivery...');
  console.log(`Recipient: ${email}`);
  console.log('');

  try {
    const success = await sendTestEmail(email);

    if (success) {
      console.log('✅ Test email sent successfully!');
      console.log('');
      console.log('Check your inbox for an email from JobMatch <jobs@jobmatch.com>');
      console.log('Subject: "Your 2 Job Matches Are Ready 🎯"');
      console.log('');
      console.log('The email should contain:');
      console.log('- 2 sample job listings');
      console.log('- Clean HTML formatting');
      console.log('- Apply Now buttons');
    } else {
      console.error('❌ Failed to send test email');
      console.error('');
      console.error('Check the logs above for error details.');
      console.error('Common issues:');
      console.error('- RESEND_API_KEY not set in .env.local');
      console.error('- API key is invalid');
      console.error('- Domain not verified in Resend dashboard');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(error);
    process.exit(1);
  }
}

main();
