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
 */
export function buildSearchQuery(parsedResume: ParsedResume): string {
  const terms: string[] = [];

  // Add top 2-3 job titles
  if (parsedResume.jobTitles && parsedResume.jobTitles.length > 0) {
    const topTitles = parsedResume.jobTitles.slice(0, 3);
    terms.push(...topTitles);
  }

  // Add top 3-5 skills
  if (parsedResume.skills && parsedResume.skills.length > 0) {
    const topSkills = parsedResume.skills.slice(0, 5);
    terms.push(...topSkills);
  }

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

  // Construct API URL with query parameters
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: what,
    where: where,
    results_per_page: maxResults.toString(),
  });

  // Add job type filters if specified
  if (parsedResume.jobTypes && parsedResume.jobTypes.includes('full-time')) {
    params.append('full_time', '1');
  }
  if (parsedResume.jobTypes && parsedResume.jobTypes.includes('part-time')) {
    params.append('part_time', '1');
  }

  const url = `${ADZUNA_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data: AdzunaResponse = await response.json();

    // Convert Adzuna jobs to our Job type
    const jobs = data.results.map(convertAdzunaJob);

    return jobs;
  } catch (error) {
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
