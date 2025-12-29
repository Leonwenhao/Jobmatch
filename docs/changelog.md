# Changelog

All notable changes to JobMatch will be documented in this file.

## [Unreleased]

### Changed
- **Job Search API Migration:** Replaced Serper API with Google Custom Search API
  - New endpoint: `https://www.googleapis.com/customsearch/v1`
  - Multi-query strategy: Parallel queries for top 3 job titles from resume
  - Includes location in search query for better relevance
  - Deduplication of results across queries
  - Fallback search with simplified query if initial search returns 0 results

### Added
- Two new job board sources:
  - `careers.jobscore.com` (JobScore)
  - `apply.workable.com` (Workable alternative domain)
- `JobScore` added to Job source type union
- Documentation files:
  - `docs/engineering-design.md`
  - `docs/architecture.md`
  - `docs/changelog.md`

### Removed
- Serper API integration (`SERPER_API_KEY` no longer required)

### Environment Variables
- **Removed:** `SERPER_API_KEY`
- **Added:** `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

---

## [1.0.0] - Initial Release

### Features
- Resume upload (PDF support)
- Claude API integration for resume parsing
- Stripe checkout for $5 payment
- Job search via Serper API (Google Search)
- Email delivery of additional jobs via Resend
- Results page with instant display of top 5 jobs
- Stateless architecture with in-memory session storage
