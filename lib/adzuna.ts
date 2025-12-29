import { ParsedResume, Job } from './types';

// Adzuna API configuration
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search/1';

function getAdzunaCredentials() {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();

  if (!appId || !appKey) {
    throw new Error('Adzuna API credentials are not configured');
  }

  return { appId, appKey };
}

interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area?: string[];
  };
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean?: number;
}

/**
 * Build search query string from parsed resume data
 * IMPORTANT: Keep queries simple to avoid 0 results
 * Adzuna treats multiple terms as AND conditions
 */
export function buildSearchQuery(parsedResume: ParsedResume): string {
  const terms: string[] = [];

  // Only use the top 1-2 job titles (DO NOT add skills - too restrictive)
  if (parsedResume.jobTitles && parsedResume.jobTitles.length > 0) {
    // Just use the first job title for best results
    // Adding more terms creates too narrow a search
    const topTitle = parsedResume.jobTitles[0];
    terms.push(topTitle);

    // Optionally add second title ONLY if first title is very generic
    const genericTitles = ['developer', 'engineer', 'manager', 'analyst', 'coordinator'];
    if (parsedResume.jobTitles.length > 1 &&
        genericTitles.some(generic => topTitle.toLowerCase().includes(generic))) {
      terms.push(parsedResume.jobTitles[1]);
    }
  }

  // Do NOT add skills to the search query
  // Skills are too specific and cause 0 results
  // The job descriptions already contain relevant skills

  return terms.join(' ');
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
 * Format salary range for display
 */
function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;

  const format = (num: number) => {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}k`;
    }
    return `$${num}`;
  };

  if (min && max) {
    return `${format(min)} - ${format(max)}`;
  } else if (min) {
    return `From ${format(min)}`;
  } else if (max) {
    return `Up to ${format(max)}`;
  }
  return undefined;
}

/**
 * Convert Adzuna job to our Job type
 */
function convertAdzunaJob(adzunaJob: AdzunaJob): Job {
  return {
    id: adzunaJob.id,
    title: adzunaJob.title,
    company: adzunaJob.company.display_name,
    location: adzunaJob.location.display_name,
    url: adzunaJob.redirect_url,
    salary: formatSalary(adzunaJob.salary_min, adzunaJob.salary_max),
    description: adzunaJob.description,
    source: 'adzuna',
  };
}

/**
 * Search for jobs using Adzuna API
 */
export async function searchJobs(
  parsedResume: ParsedResume,
  maxResults: number = 25
): Promise<Job[]> {
  // Get API credentials
  const { appId, appKey } = getAdzunaCredentials();

  // Build search parameters
  const what = buildSearchQuery(parsedResume);
  const where = extractLocation(parsedResume);

  console.log('=== Adzuna Job Search ===');
  console.log('Parsed Resume:', JSON.stringify(parsedResume, null, 2));
  console.log('Search Query (what):', what);
  console.log('Search Location (where):', where);

  // Construct API URL with query parameters
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: maxResults.toString(),
  });

  // Only add 'what' if we have search terms
  if (what && what.trim().length > 0) {
    params.append('what', what);
  } else {
    console.warn('No search terms found in resume! Searching for general jobs...');
    params.append('what', 'job'); // Fallback to very broad search
  }

  // Only add 'where' if we have a specific location
  if (where && where !== 'United States') {
    params.append('where', where);
  }
  // If location is just "United States", don't filter by location - search nationwide

  // Add job type filters if specified (but don't be too restrictive)
  if (parsedResume.jobTypes && parsedResume.jobTypes.includes('full-time')) {
    params.append('full_time', '1');
  }
  if (parsedResume.jobTypes && parsedResume.jobTypes.includes('part-time')) {
    params.append('part_time', '1');
  }

  const url = `${ADZUNA_BASE_URL}?${params.toString()}`;
  console.log('Adzuna API URL:', url.replace(appKey, 'REDACTED'));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Adzuna API Error Response:', errorText);
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data: AdzunaResponse = await response.json();
    console.log(`Adzuna returned ${data.results.length} jobs (total available: ${data.count})`);

    // If no results, try a broader search
    if (data.results.length === 0) {
      console.warn('No jobs found with specific criteria. Trying broader search...');

      // Try again with just job titles (no skills)
      if (parsedResume.jobTitles && parsedResume.jobTitles.length > 0) {
        const broaderParams = new URLSearchParams({
          app_id: appId,
          app_key: appKey,
          what: parsedResume.jobTitles[0], // Just use first job title
          results_per_page: maxResults.toString(),
        });

        const broaderUrl = `${ADZUNA_BASE_URL}?${broaderParams.toString()}`;
        console.log('Trying broader search:', broaderUrl.replace(appKey, 'REDACTED'));

        const broaderResponse = await fetch(broaderUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (broaderResponse.ok) {
          const broaderData: AdzunaResponse = await broaderResponse.json();
          console.log(`Broader search returned ${broaderData.results.length} jobs`);

          if (broaderData.results.length > 0) {
            return broaderData.results.map(convertAdzunaJob);
          }
        }
      }
    }

    // Convert Adzuna jobs to our Job type
    const jobs = data.results.map(convertAdzunaJob);

    return jobs;
  } catch (error) {
    console.error('Adzuna API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch jobs from Adzuna: ${error.message}`);
    }
    throw new Error('Failed to fetch jobs from Adzuna');
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
