import crypto from 'crypto';
import { ParsedResume, Job } from './types';

// Job boards to search via Google Custom Search
const JOB_BOARD_SITES = [
  // Tech-focused
  'jobs.ashbyhq.com',
  'boards.greenhouse.io',
  'jobs.lever.co',
  'jobs.workable.com',
  // General/non-tech
  'recruiting.paylocity.com',
  'jobs.smartrecruiters.com',
  'careers.jobscore.com',
  'apply.workable.com',
];

// Google Custom Search API configuration
const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';

function getGoogleCredentials() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim();

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  if (!searchEngineId) {
    throw new Error('GOOGLE_SEARCH_ENGINE_ID is not configured');
  }

  return { apiKey, searchEngineId };
}

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  searchInformation?: {
    totalResults: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Build site operators string for Google search
 */
function buildSiteOperators(): string {
  return JOB_BOARD_SITES.map(site => `site:${site}`).join(' OR ');
}

/**
 * Build Google search query with site operators, job title, and location
 * Format: (site:X OR site:Y) "job title" "location"
 */
export function buildSearchQuery(jobTitle: string, location: string | null): string {
  const sitePart = buildSiteOperators();
  const parts = [`(${sitePart})`, `"${jobTitle}"`];

  if (location) {
    parts.push(`"${location}"`);
  }

  return parts.join(' ');
}

/**
 * Build a broader fallback query (no location, simpler title)
 */
function buildFallbackQuery(jobTitle: string): string {
  const sitePart = buildSiteOperators();
  // Use simpler job title (first word or two)
  const simplifiedTitle = jobTitle.split(' ').slice(0, 2).join(' ');
  return `(${sitePart}) "${simplifiedTitle}"`;
}

/**
 * Extract location string from parsed resume
 */
export function extractLocation(parsedResume: ParsedResume): string | null {
  return parsedResume.location || null;
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

  return cleaned || title;
}

/**
 * Extract company name from URL or title
 */
function extractCompanyName(title: string, url: string): string {
  // Try to extract from URL first
  const urlMatch = url.match(/(?:jobs\.|boards\.|recruiting\.|careers\.|apply\.)([^.]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
  }

  // Fall back to parsing title
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
    const domain = hostname
      .replace('jobs.', '')
      .replace('boards.', '')
      .replace('recruiting.', '')
      .replace('careers.', '')
      .replace('apply.', '');
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
  const patterns = [
    /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\s*[-|]/,
    /Location:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{2})/i,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Remote';
}

/**
 * Extract salary from snippet if available
 */
function extractSalary(snippet: string): string | undefined {
  const patterns = [
    /\$[\d,]+k?\s*-\s*\$[\d,]+k?/i,
    /\$[\d,]+(?:,\d{3})*\s*-\s*\$[\d,]+(?:,\d{3})*/i,
    /salary:?\s*\$[\d,]+k?/i,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

/**
 * Extract source (job board name) from URL
 */
function extractSource(url: string): Job['source'] {
  const sourceMap: Record<string, Job['source']> = {
    'jobs.ashbyhq.com': 'Ashby',
    'boards.greenhouse.io': 'Greenhouse',
    'jobs.lever.co': 'Lever',
    'jobs.workable.com': 'Workable',
    'apply.workable.com': 'Workable',
    'recruiting.paylocity.com': 'Paylocity',
    'jobs.smartrecruiters.com': 'SmartRecruiters',
    'careers.jobscore.com': 'JobScore',
  };

  for (const [domain, name] of Object.entries(sourceMap)) {
    if (url.includes(domain)) {
      return name;
    }
  }

  return 'Job Board';
}

/**
 * Convert Google search result to Job type
 */
function convertGoogleResultToJob(result: GoogleSearchItem): Job {
  return {
    id: generateJobId(result.link),
    title: extractJobTitle(result.title),
    company: extractCompanyName(result.title, result.link),
    location: extractLocationFromResult(result.snippet, result.title),
    url: result.link,
    salary: extractSalary(result.snippet),
    description: result.snippet,
    source: extractSource(result.link),
  };
}

/**
 * Execute a single Google Custom Search query
 */
async function executeGoogleSearch(
  query: string,
  apiKey: string,
  searchEngineId: string,
  num: number = 10
): Promise<GoogleSearchItem[]> {
  const url = new URL(GOOGLE_CSE_API_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', searchEngineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(num, 10))); // Google CSE max is 10

  console.log('Google CSE Query:', query);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google CSE Error Response:', errorText);
    throw new Error(`Google CSE API error: ${response.status} - ${errorText}`);
  }

  const data: GoogleSearchResponse = await response.json();

  if (data.error) {
    throw new Error(`Google CSE API error: ${data.error.message}`);
  }

  console.log(`Google CSE returned ${data.items?.length || 0} results`);

  return data.items || [];
}

/**
 * Execute fallback search with broader query
 */
async function performFallbackSearch(
  jobTitle: string,
  apiKey: string,
  searchEngineId: string
): Promise<Job[]> {
  const fallbackQuery = buildFallbackQuery(jobTitle);
  console.log('Trying broader fallback search:', fallbackQuery);

  try {
    const results = await executeGoogleSearch(fallbackQuery, apiKey, searchEngineId, 10);
    return results.map(convertGoogleResultToJob);
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
}

/**
 * Generate fallback search terms when no job titles are available
 * Uses skills and industries to construct broader searches
 */
function generateFallbackSearchTerms(parsedResume: ParsedResume): string[] {
  const fallbackTerms: string[] = [];

  // Try to construct job titles from skills
  const techSkills = parsedResume.skills?.filter(skill =>
    /javascript|python|java|react|node|typescript|sql|aws|docker|kubernetes|golang|rust|c\+\+|c#/i.test(skill)
  ) || [];

  if (techSkills.length > 0) {
    fallbackTerms.push(`${techSkills[0]} Developer`);
    if (techSkills.length > 1) {
      fallbackTerms.push(`${techSkills[1]} Engineer`);
    }
  }

  // Use industries as search terms
  if (parsedResume.industries?.length > 0) {
    const industry = parsedResume.industries[0];
    fallbackTerms.push(`${industry} Specialist`);
  }

  // Add generic fallback based on experience level
  if (parsedResume.yearsExperience !== null) {
    if (parsedResume.yearsExperience >= 7) {
      fallbackTerms.push('Senior Software Engineer');
    } else if (parsedResume.yearsExperience >= 3) {
      fallbackTerms.push('Software Engineer');
    } else {
      fallbackTerms.push('Junior Developer');
    }
  }

  // Ultimate fallback
  if (fallbackTerms.length === 0) {
    fallbackTerms.push('Software Engineer', 'Developer', 'Engineer');
  }

  return fallbackTerms.slice(0, 3);
}

/**
 * Search for jobs using Google Custom Search API
 * Runs parallel queries for multiple job titles to maximize results
 */
export async function searchJobs(
  parsedResume: ParsedResume,
  maxResults: number = 25
): Promise<Job[]> {
  const { apiKey, searchEngineId } = getGoogleCredentials();

  console.log('=== Google Custom Search Job Search ===');
  console.log('Parsed Resume:', JSON.stringify(parsedResume, null, 2));

  // Get top 3 job titles from resume
  let jobTitles = parsedResume.jobTitles?.slice(0, 3) || [];
  const location = extractLocation(parsedResume);

  // CRITICAL FIX: If no job titles found, use fallback search terms
  if (jobTitles.length === 0) {
    console.warn('No job titles found in resume - using fallback search terms');
    jobTitles = generateFallbackSearchTerms(parsedResume);
    console.log('Generated fallback job titles:', jobTitles);
  }

  console.log('Job titles to search:', jobTitles);
  console.log('Location:', location);

  try {
    // Build queries for each job title
    const queries = jobTitles.map(title => buildSearchQuery(title, location));

    // Execute all queries in parallel
    const searchPromises = queries.map(query =>
      executeGoogleSearch(query, apiKey, searchEngineId, 10)
        .catch(error => {
          console.error('Query failed:', error);
          return [] as GoogleSearchItem[];
        })
    );

    const resultsArrays = await Promise.all(searchPromises);

    // Flatten results
    const allResults = resultsArrays.flat();

    console.log(`Total results from ${queries.length} queries: ${allResults.length}`);

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults: GoogleSearchItem[] = [];

    for (const result of allResults) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link);
        uniqueResults.push(result);
      }
    }

    console.log(`Unique results after deduplication: ${uniqueResults.length}`);

    // If we got 0 results, try fallback search
    if (uniqueResults.length === 0 && jobTitles.length > 0) {
      console.warn('No jobs found with specific criteria. Trying fallback search...');
      const fallbackJobs = await performFallbackSearch(jobTitles[0], apiKey, searchEngineId);
      return fallbackJobs.slice(0, maxResults);
    }

    // Convert to Job type
    const jobs = uniqueResults.map(convertGoogleResultToJob);

    // If we still need more results and have fewer than maxResults, try fallback
    if (jobs.length < maxResults && jobs.length < 10) {
      console.log(`Only ${jobs.length} jobs found, trying to get more with fallback...`);
      const fallbackJobs = await performFallbackSearch(jobTitles[0], apiKey, searchEngineId);

      // Add fallback jobs that aren't duplicates
      for (const job of fallbackJobs) {
        if (!seenUrls.has(job.url) && jobs.length < maxResults) {
          seenUrls.add(job.url);
          jobs.push(job);
        }
      }
    }

    return jobs.slice(0, maxResults);

  } catch (error) {
    console.error('Google CSE Error:', error);
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
