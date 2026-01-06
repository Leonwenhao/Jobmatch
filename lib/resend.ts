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
 * Generate HTML email template for job listings - Marty Supreme Style
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111111;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      background-color: #ffffff;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #FF8100;
    }
    .logo {
      color: #FF8100;
      font-weight: 800;
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #111111;
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .header h1 span {
      color: #FF8100;
    }
    .header p {
      color: #666666;
      margin: 0;
      font-size: 16px;
    }
    .job {
      margin-bottom: 16px;
      padding: 20px 24px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      background-color: #ffffff;
    }
    .job:hover {
      border-color: #FF8100;
    }
    .job-title {
      font-size: 17px;
      font-weight: 600;
      color: #111111;
      margin: 0 0 8px 0;
    }
    .job-meta {
      color: #666666;
      font-size: 14px;
      margin: 0 0 12px 0;
    }
    .job-salary {
      color: #FF8100;
      font-weight: 600;
    }
    .apply-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #111111;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
    }
    .footer p {
      color: #999999;
      font-size: 13px;
      margin: 8px 0;
    }
    .footer .brand {
      color: #FF8100;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.01em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">JobMatch</div>
      <h1>Your <span>Matches</span> Are Ready</h1>
      <p>${jobs.length} jobs matched to your skills</p>
    </div>

    ${jobs.map((job, index) => `
      <div class="job">
        <h2 class="job-title">${escapeHtml(job.title)}</h2>
        <p class="job-meta">
          ${escapeHtml(job.company)}${job.location ? ` &bull; ${escapeHtml(job.location)}` : ''}${job.salary ? ` &bull; <span class="job-salary">${escapeHtml(job.salary)}</span>` : ''}
        </p>
        <a href="${escapeHtml(job.url)}" class="apply-button">Apply Now</a>
      </div>
    `).join('')}

    <div class="footer">
      <p>Good luck with your job search!</p>
      <p class="brand">JobMatch</p>
      <p style="font-size: 11px; color: #bbbbbb; margin-top: 16px;">
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
        subject: `Your JobMatch Results - ${jobs.length} Jobs Found`,
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
