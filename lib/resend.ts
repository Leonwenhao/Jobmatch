import { Resend } from 'resend';
import { Job } from './types';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Generate HTML email template for job listings
 */
function generateJobEmailHTML(jobs: Job[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Job Matches</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      color: #2563eb;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #6b7280;
      margin: 0;
      font-size: 16px;
    }
    .job {
      margin-bottom: 25px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background-color: #f9fafb;
    }
    .job-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 10px 0;
    }
    .job-company {
      color: #4b5563;
      font-size: 15px;
      margin: 5px 0;
    }
    .job-location {
      color: #6b7280;
      font-size: 14px;
      margin: 5px 0;
    }
    .job-salary {
      color: #059669;
      font-size: 14px;
      font-weight: 500;
      margin: 5px 0;
    }
    .apply-button {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 20px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 500;
      font-size: 14px;
    }
    .apply-button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Your Job Matches Are Ready!</h1>
      <p>Here are all ${jobs.length} jobs matched to your resume</p>
    </div>

    ${jobs.map((job, index) => `
      <div class="job">
        <h2 class="job-title">${index + 1}. ${escapeHtml(job.title)}</h2>
        <p class="job-company">🏢 ${escapeHtml(job.company)}</p>
        <p class="job-location">📍 ${escapeHtml(job.location)}</p>
        ${job.salary ? `<p class="job-salary">💰 ${escapeHtml(job.salary)}</p>` : ''}
        <a href="${escapeHtml(job.url)}" class="apply-button">Apply Now →</a>
      </div>
    `).join('')}

    <div class="footer">
      <p>Good luck with your job search!</p>
      <p style="margin-top: 10px;">
        <strong>JobMatch</strong> - Helping you find your next opportunity
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        You received this email because you used JobMatch to find job opportunities.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Send job listings email
 */
export async function sendJobEmail(
  to: string,
  jobs: Job[],
  retries: number = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Validate email before attempting to send
  if (!isValidEmail(to)) {
    console.error(`Invalid email address: "${to}"`);
    return {
      success: false,
      error: `Invalid email address format: "${to}"`,
    };
  }

  // Validate jobs array
  if (!jobs || jobs.length === 0) {
    console.error('No jobs to send');
    return {
      success: false,
      error: 'No jobs to send in email',
    };
  }

  const resend = getResendClient();

  // Generate HTML content
  const html = generateJobEmailHTML(jobs);

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'JobMatch <jobs@doloresresearch.com>',
        to: [to],
        subject: `Your JobMatch Results - ${jobs.length} Jobs Found 🎯`,
        html: html,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }

      console.log(`Email sent successfully to ${to}, messageId: ${data?.id}`);

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Email send attempt ${attempt}/${retries} failed:`, lastError.message);

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Failed to send email after retries',
  };
}

/**
 * Send test email
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  const testJobs: Job[] = [
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      url: 'https://example.com/job/1',
      salary: '$120k - $160k',
      source: 'Greenhouse',
    },
    {
      id: '2',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      url: 'https://example.com/job/2',
      salary: '$100k - $140k',
      source: 'Ashby',
    },
  ];

  const result = await sendJobEmail(to, testJobs, 1);
  return result.success;
}
