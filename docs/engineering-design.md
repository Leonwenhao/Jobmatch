# Engineering Design

## Overview

JobMatch is a stateless web application that matches job seekers with relevant job postings. Users upload their resume, pay $5, and receive 25 curated job postings (5 instantly, 20 via email).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Payments | Stripe Checkout (guest mode) |
| Resume Parsing | Claude API (Anthropic) |
| Job Search | Google Custom Search API |
| Email | Resend |

## API Integrations

### Claude API (Resume Parsing)

**Purpose:** Extract structured data from uploaded resumes.

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Input:** PDF or text resume content

**Output:** `ParsedResume` object containing:
- `jobTitles`: Array of job titles/roles from resume
- `skills`: Technical and soft skills
- `yearsExperience`: Years of experience
- `location`: Geographic location
- `industries`: Industries worked in
- `education`: Education level
- `jobTypes`: Preferred job types (full-time, remote, etc.)

### Google Custom Search API (Job Search)

**Purpose:** Find relevant job postings across major job boards.

**Endpoint:** `https://www.googleapis.com/customsearch/v1`

**Parameters:**
- `key`: API key
- `cx`: Search engine ID
- `q`: Search query with site operators
- `num`: Results per query (max 10)

**Query Format:**
```
(site:jobs.ashbyhq.com OR site:boards.greenhouse.io OR ...) "Job Title" "Location"
```

**Target Job Boards:**
- jobs.ashbyhq.com (Ashby)
- boards.greenhouse.io (Greenhouse)
- jobs.lever.co (Lever)
- jobs.workable.com (Workable)
- apply.workable.com (Workable)
- recruiting.paylocity.com (Paylocity)
- jobs.smartrecruiters.com (SmartRecruiters)
- careers.jobscore.com (JobScore)

**Multi-Query Strategy:**
Since Google CSE returns max 10 results per request, we run parallel queries:
1. Extract top 3 job titles from parsed resume
2. Run separate query for each job title (with location)
3. Deduplicate results by URL
4. Return up to 25 unique jobs

**Fallback Behavior:**
If initial queries return 0 results, a broader fallback query is executed with simplified job title and no location filter.

### Stripe API (Payments)

**Purpose:** Process $5 payment for job search service.

**Mode:** Guest checkout (no account required)

**Flow:**
1. Create checkout session with session ID in metadata
2. Redirect user to Stripe-hosted payment page
3. Webhook receives `checkout.session.completed` event
4. Trigger job search and email delivery

### Resend API (Email)

**Purpose:** Deliver remaining 20 jobs via email.

**Features:**
- HTML email template with job cards
- Apply links for each job
- Retry logic with exponential backoff

## Data Types

### ParsedResume
```typescript
interface ParsedResume {
  jobTitles: string[];
  skills: string[];
  yearsExperience: number | null;
  location: string | null;
  industries: string[];
  education: string | null;
  jobTypes: ('full-time' | 'part-time' | 'contract' | 'remote')[];
}
```

### Job
```typescript
interface Job {
  id: string;           // MD5 hash of URL (12 chars)
  title: string;
  company: string;
  location: string;
  url: string;
  salary?: string;
  description?: string;
  source: 'Ashby' | 'Greenhouse' | 'Lever' | 'Workable' |
          'Paylocity' | 'SmartRecruiters' | 'JobScore' | 'Job Board';
}
```

### Session
```typescript
interface Session {
  id: string;
  email: string;
  resumeText: string;
  parsedResume?: ParsedResume;
  jobs?: Job[];
  status: 'pending' | 'paid' | 'processing' | 'complete' | 'failed';
  createdAt: Date;
}
```

## Job Data Extraction

Job details are extracted from Google search result snippets:

| Field | Extraction Method |
|-------|-------------------|
| Title | Remove company suffix from result title |
| Company | Parse from URL subdomain or title |
| Location | Regex patterns for "City, ST" format |
| Salary | Regex patterns for "$X - $Y" format |
| Source | Map URL domain to job board name |

## Error Handling

- **Resume parsing:** Validates minimum 50 characters and work-related keywords
- **Job search:** Fallback query if initial search returns 0 results
- **Email delivery:** Retry with exponential backoff, doesn't block session completion
- **Stripe errors:** Mapped to user-friendly messages

## Security Considerations

- Resume text not persisted (only parsed data stored in memory)
- Sessions auto-delete after 2-hour TTL
- No database = no long-term data storage
- Environment variables for all API keys
