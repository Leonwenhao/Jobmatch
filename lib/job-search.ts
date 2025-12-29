import crypto from 'crypto';
import { ParsedResume, Job } from './types';

// Job boards to search via Google
const JOB_BOARD_SITES = [
  'jobs.ashbyhq.com',
  'boards.greenhouse.io',
  'jobs.lever.co',
  'jobs.workable.com',
  'recruiting.paylocity.com',
  'jobs.smartrecruiters.com'
];

// Serper API configuration
const SERPER_API_URL = 'https://google.serper.dev/search';

function getSerperCredentials() {
  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('Serper API key is not configured');
  }

  return { apiKey };
}

interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  organic: GoogleResult[];
  searchParameters?: any;
}

/**
 * Build Google search query with site operators
 * Format: (site:X OR site:Y) "job title" location
 * IMPORTANT: Keep queries simple to avoid 0 results
 */
export function buildSearchQuery(parsedResume: ParsedResume): string {
  // Build site operators
  const sitePart = JOB_BOARD_SITES
    .map(site => `site:${site}`)
    .join(' OR ');

  // Only use the top 1-2 job titles (DO NOT add skills - too restrictive)
  const jobTitlePart: string[] = [];
  if (parsedResume.jobTitles && parsedResume.jobTitles.length > 0) {
    const topTitle = parsedResume.jobTitles[0];
    jobTitlePart.push(`"${topTitle}"`);

    // Optionally add second title ONLY if first title is very generic
    const genericTitles = ['developer', 'engineer', 'manager', 'analyst', 'coordinator'];
    if (parsedResume.jobTitles.length > 1 &&
        genericTitles.some(generic => topTitle.toLowerCase().includes(generic))) {
      jobTitlePart.push(`"${parsedResume.jobTitles[1]}"`);
    }
  }

  // Note: Omitting location from query as Serper restricts location filters with site: operators
  // Job boards will have location info in their listings that we'll extract

  // Combine: (site:X OR site:Y) "job title"
  const query = [
    `(${sitePart})`,
    ...jobTitlePart
  ].filter(Boolean).join(' ');

  return query;
}

/**
 * Build fallback query for zero results
 */
function buildFallbackQuery(parsedResume: ParsedResume): string {
  const sitePart = JOB_BOARD_SITES
    .map(site => `site:${site}`)
    .join(' OR ');

  // Just use first job title without location restrictions
  const topTitle = parsedResume.jobTitles?.[0] || 'job';

  return `(${sitePart}) "${topTitle}"`;
}

/**
 * Extract location string from parsed resume
 */
export function extractLocation(parsedResume: ParsedResume): string {
  if (parsedResume.location) {
    return parsedResume.location;
  }
  return 'United States'; // Default fallback
}

/**
 * Generate unique job ID from URL using MD5 hash
 */
function generateJobId(url: string): string {
  return crypto
    .createHash('md5')
    .update(url)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Extract job title from Google result title
 * Removes company suffix like " - Company Name" or " | Company"
 */
function extractJobTitle(title: string): string {
  const cleaned = title
    .replace(/\s*[-–|]\s*.+$/, '') // Remove everything after dash/pipe
    .replace(/\s+at\s+.+$/i, '')    // Remove "at Company"
    .trim();

  return cleaned || title; // Fall back to full title if cleaning fails
}

/**
 * Extract company name from URL or title
 */
function extractCompanyName(title: string, url: string): string {
  // Try to extract from URL first
  const urlMatch = url.match(/(?:jobs\.|boards\.|recruiting\.)([^.]+)/);
  if (urlMatch && urlMatch[1]) {
    // Capitalize first letter
    return urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
  }

  // Fall back to parsing title (look for " at ", " - ", etc.)
  const atMatch = title.match(/\bat\s+(.+?)(?:\s*[-|]|$)/i);
  if (atMatch && atMatch[1]) {
    return atMatch[1].trim();
  }

  const dashMatch = title.match(/[-–]\s*(.+?)(?:\s*[-|]|$)/);
  if (dashMatch && dashMatch[1]) {
    return dashMatch[1].trim();
  }

  // Last resort: use domain name
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace('jobs.', '').replace('boards.', '').replace('recruiting.', '');
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Unknown Company';
  }
}

/**
 * Extract location from snippet or title
 */
function extractLocationFromResult(snippet: string, title: string): string {
  // Common patterns in job postings
  const patterns = [
    /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/,  // "in New York, NY"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\s*[-|]/, // "New York, NY -"
    /Location:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{2})/i, // "Location: New York NY"
  ];

  // Try snippet first
  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Try title
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Default fallback
  return 'Remote'; // Most job boards default to remote if location not specified
}

/**
 * Extract salary from snippet if available
 */
function extractSalary(snippet: string): string | undefined {
  // Common salary patterns
  const patterns = [
    /\$[\d,]+k?\s*-\s*\$[\d,]+k?/i,           // "$80k - $100k"
    /\$[\d,]+(?:,\d{3})*\s*-\s*\$[\d,]+(?:,\d{3})*/i, // "$80,000 - $100,000"
    /salary:?\s*\$[\d,]+k?/i,                  // "Salary: $80k"
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined; // No salary found
}

/**
 * Extract source (job board name) from URL
 */
function extractSource(url: string): string {
  const sourceMap: Record<string, string> = {
    'jobs.ashbyhq.com': 'Ashby',
    'boards.greenhouse.io': 'Greenhouse',
    'jobs.lever.co': 'Lever',
    'jobs.workable.com': 'Workable',
    'recruiting.paylocity.com': 'Paylocity',
    'jobs.smartrecruiters.com': 'SmartRecruiters',
  };

  for (const [domain, name] of Object.entries(sourceMap)) {
    if (url.includes(domain)) {
      return name;
    }
  }

  return 'Job Board'; // Fallback
}

/**
 * Convert Google search result to Job type
 */
function convertGoogleResultToJob(result: GoogleResult, index: number): Job {
  const jobTitle = extractJobTitle(result.title);
  const company = extractCompanyName(result.title, result.link);
  const location = extractLocationFromResult(result.snippet, result.title);
  const salary = extractSalary(result.snippet);
  const source = extractSource(result.link);

  return {
    id: generateJobId(result.link),
    title: jobTitle,
    company: company,
    location: location,
    url: result.link,
    salary: salary,
    description: result.snippet,
    source: source as any, // Type will be updated in types.ts
  };
}

/**
 * Perform fallback search with broader query
 */
async function performFallbackSearch(
  parsedResume: ParsedResume,
  maxResults: number,
  apiKey: string
): Promise<Job[]> {
  const fallbackQuery = buildFallbackQuery(parsedResume);
  console.log('Trying broader search:', fallbackQuery);

  const response = await fetch(SERPER_API_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: fallbackQuery,
      num: maxResults,
      gl: 'us',
    }),
  });

  if (!response.ok) {
    console.error('Fallback search failed');
    return []; // Return empty array if fallback also fails
  }

  const data: SerperResponse = await response.json();
  console.log(`Broader search returned ${data.organic?.length || 0} jobs`);

  if (!data.organic || data.organic.length === 0) {
    return [];
  }

  return data.organic
    .map((result: GoogleResult, index: number) => convertGoogleResultToJob(result, index))
    .slice(0, maxResults);
}

/**
 * Search for jobs using Serper API (Google Search)
 */
export async function searchJobs(
  parsedResume: ParsedResume,
  maxResults: number = 25
): Promise<Job[]> {
  // Get API credentials
  const { apiKey } = getSerperCredentials();

  // Build search query
  const query = buildSearchQuery(parsedResume);

  console.log('=== Google Job Search (Serper) ===');
  console.log('Parsed Resume:', JSON.stringify(parsedResume, null, 2));
  console.log('Search Query:', query);

  try {
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
        gl: 'us', // Search in US
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serper API Error Response:', errorText);
      throw new Error(`Serper API error: ${response.status} - ${errorText}`);
    }

    const data: SerperResponse = await response.json();
    console.log(`Serper returned ${data.organic?.length || 0} results`);

    // Handle empty results with fallback
    if (!data.organic || data.organic.length === 0) {
      console.warn('No jobs found with specific criteria. Trying broader search...');
      return await performFallbackSearch(parsedResume, maxResults, apiKey);
    }

    // Convert Google results to Job type
    const jobs = data.organic.map((result: GoogleResult, index: number) =>
      convertGoogleResultToJob(result, index)
    );

    return jobs.slice(0, maxResults);

  } catch (error) {
    console.error('Serper API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch jobs from Google: ${error.message}`);
    }
    throw new Error('Failed to fetch jobs from Google');
  }
}

/**
 * Get top N jobs from search results
 */
export async function getTopJobs(
  parsedResume: ParsedResume,
  count: number = 5
): Promise<Job[]> {
  const allJobs = await searchJobs(parsedResume, 25);
  return allJobs.slice(0, count);
}

/**
 * Check if any jobs were found for the given criteria
 */
export async function hasJobResults(parsedResume: ParsedResume): Promise<boolean> {
  try {
    const jobs = await searchJobs(parsedResume, 1);
    return jobs.length > 0;
  } catch (error) {
    console.error('Error checking for job results:', error);
    return false;
  }
}
