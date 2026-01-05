# Changelog

All notable changes to JobMatch will be documented in this file.

## [1.3.0] - 2025-12-30

### Fixed
- **Email Not Sending Issue**
  - Root cause: Email was only sent when `jobs.length > 5`, but job search often returned fewer
  - Changed email logic to send ALL jobs as a receipt/backup regardless of count
  - Added better logging for email send attempts and failures

- **Inconsistent Job Count**
  - Root cause: Fallback search only triggered when `jobs.length < 10`, not below target of 25
  - Implemented 3-tier search strategy to reliably return 25 jobs:
    1. Initial parallel searches for top 3 job titles with location
    2. Retry without location filter if below target
    3. Broader search with skills-based fallback terms

### Changed
- **Results Page Now Shows All Jobs**
  - Previously showed only 5 jobs, emailed 20 more
  - Now displays all 25 jobs on results page
  - Email serves as receipt/backup copy
  - Updated UI messaging to reflect new behavior

### Technical Details
- `lib/job-search.ts`: Enhanced fallback logic with multiple search strategies
- `app/api/webhook/route.ts`: Send all jobs in email, not just overflow
- `app/api/results/[sessionId]/route.ts`: Return all jobs, not just first 5
- `app/results/[sessionId]/page.tsx`: Updated messaging for all-jobs display
- `lib/resend.ts`: Updated email subject line

---

## [1.2.0] - 2025-12-29

### Fixed
- **Critical: "No Matches Found" Issue Resolved**
  - Root cause: Stripe webhook was not configured, and API keys were from wrong Stripe account
  - Added fallback job search in results endpoint - if session exists but has no jobs, search runs on-demand
  - This makes the app resilient to webhook failures

### Added
- Results endpoint fallback search logic
- Debug endpoint: `/api/debug-search` for testing search pipeline
- Post-mortem documentation for debugging lessons learned
- Test scripts: `verify-fix.ts`, `test-edge-cases.ts`, `test-google-cse.ts`

### Changed
- Updated CLAUDE.md with critical Stripe webhook configuration notes
- Updated DEPLOYMENT.md with Test vs Live mode webhook instructions
- Enhanced logging throughout webhook and results endpoints

### Lessons Learned
- Always check Stripe webhook configuration FIRST when debugging payment issues
- Test mode and Live mode have SEPARATE webhooks in Stripe
- Verify API keys match the Stripe account in the dashboard
- See `docs/POST-MORTEM-2025-12-29.md` for full analysis

---

## [1.1.0] - 2025-12-29

### Changed
- **Session Storage:** Replaced in-memory storage with Upstash Redis
  - Sessions now persist across serverless function instances
  - 2-hour TTL for automatic cleanup
  - Backup recovery from Stripe metadata if Redis session expires

- **Job Search API:** Replaced Serper API with Google Custom Search API
  - More reliable results from job board sites
  - Multi-query strategy: Parallel queries for top 3 job titles
  - Includes location in search query for better relevance
  - Deduplication of results across queries
  - Fallback search terms generated from skills if no job titles found

### Added
- Upstash Redis integration (`lib/storage.ts`)
- Fallback search term generation from skills/industries
- Session recovery from Stripe checkout metadata
- Two new job board sources:
  - `careers.jobscore.com` (JobScore)
  - `apply.workable.com` (Workable alternative domain)

### Environment Variables
- **Added:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Added:** `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`
- **Removed:** `SERPER_API_KEY`
- **Removed:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`

---

## [1.0.0] - 2025-12-28 - Initial Release

### Features
- Resume upload (PDF support via Claude API)
- Claude API integration for resume parsing
- Stripe Checkout for $5 payment
- Job search via Adzuna API
- Email delivery of additional jobs via Resend
- Results page with instant display of top 5 jobs
- Stateless architecture with in-memory session storage

### Known Issues at Launch
- In-memory storage doesn't persist across serverless instances (fixed in 1.1.0)
- Adzuna search queries too specific (fixed in 1.1.0)
