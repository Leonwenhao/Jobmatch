import crypto from 'crypto';
import { ParsedResume, Job } from './types';

// SearchAPI.io Google Jobs API
const SEARCHAPI_URL = 'https://www.searchapi.io/api/v1/search';

function getSearchAPIKey(): string {
  const apiKey = process.env.SEARCHAPI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('SEARCHAPI_API_KEY is not configured');
  }
  return apiKey;
}

// SearchAPI.io response types
interface SearchAPIJob {
  title: string;
  company_name: string;
  location: string;
  description?: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
  apply_options?: Array<{
    title: string;
    link: string;
  }>;
  apply_link?: string;
  job_id?: string;
  share_link?: string;
  related_links?: Array<{
    link: string;
    text: string;
  }>;
}

interface SearchAPIResponse {
  search_metadata?: {
    id: string;
    status: string;
    created_at: string;
  };
  search_parameters?: {
    q: string;
    engine: string;
  };
  jobs?: SearchAPIJob[];
  pagination?: {
    next_page_token?: string;
  };
  error?: string;
}

/**
 * Generate unique job ID from URL or title+company
 */
function generateJobId(url: string, title: string, company: string): string {
  const input = url || `${title}-${company}`;
  return crypto
    .createHash('md5')
    .update(input)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Extract the best apply link from job data
 */
function extractApplyLink(job: SearchAPIJob): string {
  if (job.apply_link) {
    return job.apply_link;
  }

  if (job.apply_options && job.apply_options.length > 0) {
    const directLink = job.apply_options.find(opt =>
      !opt.link.includes('indeed.com') &&
      !opt.link.includes('linkedin.com') &&
      !opt.link.includes('glassdoor.com')
    );
    if (directLink) return directLink.link;
    return job.apply_options[0].link;
  }

  if (job.related_links && job.related_links.length > 0) {
    const applyLink = job.related_links.find(link =>
      link.text?.toLowerCase().includes('apply') ||
      link.link.includes('careers') ||
      link.link.includes('jobs')
    );
    if (applyLink) return applyLink.link;
    return job.related_links[0].link;
  }

  if (job.share_link) return job.share_link;

  return `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company_name + ' careers')}`;
}

/**
 * Determine job source from apply link
 */
function extractSource(url: string): Job['source'] {
  const sourceMap: Record<string, Job['source']> = {
    'ashbyhq.com': 'Ashby',
    'greenhouse.io': 'Greenhouse',
    'lever.co': 'Lever',
    'workable.com': 'Workable',
    'paylocity.com': 'Paylocity',
    'smartrecruiters.com': 'SmartRecruiters',
    'jobscore.com': 'JobScore',
  };

  for (const [domain, name] of Object.entries(sourceMap)) {
    if (url.includes(domain)) {
      return name;
    }
  }

  return 'Job Board';
}

/**
 * Convert SearchAPI job to our Job type
 */
function convertToJob(apiJob: SearchAPIJob): Job {
  const applyLink = extractApplyLink(apiJob);

  return {
    id: generateJobId(applyLink, apiJob.title, apiJob.company_name),
    title: apiJob.title,
    company: apiJob.company_name,
    location: apiJob.location || 'Remote',
    url: applyLink,
    salary: apiJob.detected_extensions?.salary,
    description: apiJob.description?.substring(0, 300) + (apiJob.description && apiJob.description.length > 300 ? '...' : ''),
    source: extractSource(applyLink),
  };
}

/**
 * Execute a single SearchAPI Google Jobs query
 * Each call uses 1 API credit
 */
async function executeSearchAPIQuery(
  query: string,
  apiKey: string,
  location?: string
): Promise<SearchAPIJob[]> {
  const url = new URL(SEARCHAPI_URL);
  url.searchParams.set('engine', 'google_jobs');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);

  if (location) {
    url.searchParams.set('location', location);
  }

  console.log(`SearchAPI Query: "${query}" ${location ? `in ${location}` : ''}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SearchAPI Error Response:', errorText);
    throw new Error(`SearchAPI error: ${response.status} - ${errorText}`);
  }

  const data: SearchAPIResponse = await response.json();

  if (data.error) {
    throw new Error(`SearchAPI error: ${data.error}`);
  }

  const jobCount = data.jobs?.length || 0;
  console.log(`SearchAPI returned ${jobCount} jobs`);

  return data.jobs || [];
}

/**
 * Infer relevant job titles from resume skills, industries, and experience
 * This creates searchable job titles even when the resume has non-standard titles
 */
function inferJobTitlesFromResume(parsedResume: ParsedResume): string[] {
  const inferredTitles: string[] = [];
  const skills = parsedResume.skills || [];
  const industries = parsedResume.industries || [];
  const yearsExp = parsedResume.yearsExperience || 0;

  // Skill-based job title inference
  const skillLower = skills.map(s => s.toLowerCase()).join(' ');

  // Tech/Engineering
  if (/javascript|typescript|react|vue|angular|frontend|front-end|html|css/.test(skillLower)) {
    inferredTitles.push('Frontend Developer', 'Frontend Engineer');
  }
  if (/node|python|java|golang|rust|backend|back-end|api|server/.test(skillLower)) {
    inferredTitles.push('Backend Developer', 'Software Engineer');
  }
  if (/react|node|fullstack|full-stack|typescript/.test(skillLower)) {
    inferredTitles.push('Full Stack Developer', 'Full Stack Engineer');
  }
  if (/aws|azure|gcp|cloud|docker|kubernetes|devops|infrastructure/.test(skillLower)) {
    inferredTitles.push('DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer');
  }
  if (/data|sql|python|analytics|tableau|power bi|statistics/.test(skillLower)) {
    inferredTitles.push('Data Analyst', 'Business Intelligence Analyst', 'Data Scientist');
  }
  if (/machine learning|ml|ai|tensorflow|pytorch|llm|nlp/.test(skillLower)) {
    inferredTitles.push('Machine Learning Engineer', 'AI Engineer', 'Data Scientist');
  }
  if (/ios|swift|android|kotlin|mobile|react native|flutter/.test(skillLower)) {
    inferredTitles.push('Mobile Developer', 'iOS Developer', 'Android Developer');
  }

  // Design
  if (/figma|sketch|ui|ux|design|user experience|wireframe|prototype/.test(skillLower)) {
    inferredTitles.push('UX Designer', 'Product Designer', 'UI Designer');
  }

  // Product & Management
  if (/product|roadmap|agile|scrum|jira|stakeholder|requirements/.test(skillLower)) {
    inferredTitles.push('Product Manager', 'Technical Product Manager', 'Program Manager');
  }
  if (/project management|pmp|timeline|budget|resource/.test(skillLower)) {
    inferredTitles.push('Project Manager', 'Technical Project Manager');
  }

  // Marketing & Content
  if (/marketing|seo|sem|social media|content|copywriting|campaign/.test(skillLower)) {
    inferredTitles.push('Marketing Manager', 'Digital Marketing Manager', 'Content Strategist');
  }
  if (/video|premiere|after effects|film|production|editing/.test(skillLower)) {
    inferredTitles.push('Video Producer', 'Content Creator', 'Creative Producer');
  }

  // Business & Operations
  if (/sales|business development|crm|pipeline|revenue/.test(skillLower)) {
    inferredTitles.push('Sales Manager', 'Business Development Manager', 'Account Executive');
  }
  if (/operations|process|efficiency|logistics|supply chain/.test(skillLower)) {
    inferredTitles.push('Operations Manager', 'Business Operations');
  }
  if (/finance|accounting|financial|budget|forecast/.test(skillLower)) {
    inferredTitles.push('Financial Analyst', 'Finance Manager');
  }

  // Web3/Crypto specific
  if (/blockchain|web3|crypto|nft|smart contract|solidity|defi/.test(skillLower)) {
    inferredTitles.push('Web3 Developer', 'Blockchain Developer', 'Crypto Product Manager');
  }

  // AI/Generative AI specific
  if (/generative ai|prompt|gpt|llm|chatgpt|anthropic|openai/.test(skillLower)) {
    inferredTitles.push('AI Product Manager', 'Prompt Engineer', 'AI Solutions Engineer');
  }

  // Industry-based inference
  const industryLower = industries.map(i => i.toLowerCase()).join(' ');
  if (/startup|tech|saas/.test(industryLower) && inferredTitles.length === 0) {
    inferredTitles.push('Software Engineer', 'Product Manager');
  }
  if (/fintech|finance|banking/.test(industryLower)) {
    inferredTitles.push('Fintech Product Manager', 'Financial Software Engineer');
  }
  if (/healthcare|health|medical/.test(industryLower)) {
    inferredTitles.push('Healthcare Product Manager', 'Health Tech Engineer');
  }

  // Seniority prefixes based on experience
  if (yearsExp >= 8) {
    // Add senior/lead versions
    const seniorTitles = inferredTitles.slice(0, 3).map(t => `Senior ${t}`);
    inferredTitles.push(...seniorTitles);
    inferredTitles.push('Engineering Manager', 'Director of Engineering', 'VP of Product');
  } else if (yearsExp >= 5) {
    const seniorTitles = inferredTitles.slice(0, 2).map(t => `Senior ${t}`);
    inferredTitles.push(...seniorTitles);
  }

  // Remove duplicates and limit
  return [...new Set(inferredTitles)].slice(0, 10);
}

/**
 * Get a diverse set of search queries combining resume titles and inferred titles
 */
function getSearchQueries(parsedResume: ParsedResume): string[] {
  const queries: string[] = [];

  // Start with explicit job titles from resume (if any are reasonable)
  const resumeTitles = parsedResume.jobTitles || [];
  const goodResumeTitles = resumeTitles.filter(title => {
    const lower = title.toLowerCase();
    // Filter out titles that won't search well
    return !lower.includes('founder') &&
           !lower.includes('ceo') &&
           !lower.includes('owner') &&
           !lower.includes('consultant') &&
           title.length < 40;
  });

  queries.push(...goodResumeTitles.slice(0, 2));

  // Add inferred titles
  const inferredTitles = inferJobTitlesFromResume(parsedResume);
  queries.push(...inferredTitles);

  // Remove duplicates
  return [...new Set(queries)].slice(0, 8);
}

/**
 * Main job search function using SearchAPI.io Google Jobs
 *
 * GUARANTEED to return up to maxResults jobs by:
 * 1. Using inferred job titles from skills (not just resume titles)
 * 2. Running multiple queries until we hit the target
 * 3. Searching with and without location restrictions
 */
export async function searchJobs(
  parsedResume: ParsedResume,
  maxResults: number = 25
): Promise<Job[]> {
  const apiKey = getSearchAPIKey();

  console.log('=== SearchAPI.io Google Jobs Search ===');
  console.log('Parsed Resume:', JSON.stringify(parsedResume, null, 2));

  const location = parsedResume.location || null;
  const allJobs: Job[] = [];
  const seenIds = new Set<string>();

  // Get diverse search queries (both from resume and inferred from skills)
  const searchQueries = getSearchQueries(parsedResume);
  console.log('Search queries to try:', searchQueries);
  console.log('Location:', location);

  let queryCount = 0;
  const maxQueries = 7; // Increased from 5 to allow Phase 3 execution for better coverage

  try {
    // Phase 1: Search with location for first 2-3 queries
    for (const query of searchQueries.slice(0, 3)) {
      if (allJobs.length >= maxResults || queryCount >= maxQueries) break;

      queryCount++;
      console.log(`\n--- Query ${queryCount}: "${query}" in "${location || 'any'}" ---`);

      const results = await executeSearchAPIQuery(query, apiKey, location || undefined);

      for (const apiJob of results) {
        const job = convertToJob(apiJob);
        if (!seenIds.has(job.id) && allJobs.length < maxResults) {
          seenIds.add(job.id);
          allJobs.push(job);
        }
      }
      console.log(`Total unique jobs: ${allJobs.length}`);
    }

    // Phase 2: Search WITHOUT location if we need more jobs
    if (allJobs.length < maxResults) {
      for (const query of searchQueries.slice(0, 3)) {
        if (allJobs.length >= maxResults || queryCount >= maxQueries) break;

        queryCount++;
        console.log(`\n--- Query ${queryCount} (no location): "${query}" ---`);

        const results = await executeSearchAPIQuery(query, apiKey);

        for (const apiJob of results) {
          const job = convertToJob(apiJob);
          if (!seenIds.has(job.id) && allJobs.length < maxResults) {
            seenIds.add(job.id);
            allJobs.push(job);
          }
        }
        console.log(`Total unique jobs: ${allJobs.length}`);
      }
    }

    // Phase 3: Try additional inferred queries if still short
    if (allJobs.length < maxResults && searchQueries.length > 3) {
      for (const query of searchQueries.slice(3)) {
        if (allJobs.length >= maxResults || queryCount >= maxQueries) break;

        queryCount++;
        console.log(`\n--- Query ${queryCount} (additional): "${query}" ---`);

        const results = await executeSearchAPIQuery(query, apiKey, location || undefined);

        for (const apiJob of results) {
          const job = convertToJob(apiJob);
          if (!seenIds.has(job.id) && allJobs.length < maxResults) {
            seenIds.add(job.id);
            allJobs.push(job);
          }
        }
        console.log(`Total unique jobs: ${allJobs.length}`);
      }
    }

    console.log(`\n=== Final Results: ${allJobs.length} jobs (used ${queryCount} API calls) ===`);

    // Warn if we couldn't reach the target
    if (allJobs.length < maxResults) {
      console.warn(`⚠️ WARNING: Only found ${allJobs.length}/${maxResults} jobs. Consider expanding search criteria.`);
    }

    return allJobs.slice(0, maxResults);

  } catch (error) {
    console.error('SearchAPI Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to search jobs: ${error.message}`);
    }
    throw new Error('Failed to search jobs');
  }
}

/**
 * Get top N jobs - convenience function
 */
export async function getTopJobs(
  parsedResume: ParsedResume,
  count: number = 5
): Promise<Job[]> {
  const allJobs = await searchJobs(parsedResume, 25);
  return allJobs.slice(0, count);
}

/**
 * Check if any jobs can be found for the given criteria
 */
export async function hasJobResults(parsedResume: ParsedResume): Promise<boolean> {
  try {
    const jobs = await searchJobs(parsedResume, 5);
    return jobs.length > 0;
  } catch (error) {
    console.error('Error checking for job results:', error);
    return false;
  }
}

// Legacy exports for backwards compatibility
export function buildSearchQuery(jobTitle: string, location: string | null): string {
  return location ? `${jobTitle} in ${location}` : jobTitle;
}

export function extractLocation(parsedResume: ParsedResume): string | null {
  return parsedResume.location || null;
}
