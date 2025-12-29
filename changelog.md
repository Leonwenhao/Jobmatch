# Changelog: JobMatch

All notable changes to this project will be documented in this file.

Format: 
```
## [Date] - Brief Description
### Added / Changed / Fixed / Removed
- Detail
```

---

## [Unreleased]

### Changed
- **BREAKING:** Replaced Adzuna API with Serper API (Google Search)
  - Now searches specific job boards: Ashby, Greenhouse, Lever, Workable, Paylocity, SmartRecruiters
  - Renamed `lib/adzuna.ts` to `lib/job-search.ts` for provider-agnostic naming
  - Environment: `SERPER_API_KEY` replaces `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`
  - Job source field now shows specific job board name instead of "adzuna"
  - Enhanced location and salary extraction from Google search results

### Migration Guide
1. Obtain Serper API key from https://serper.dev/
2. Update `.env.local`:
   - Remove: `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`
   - Add: `SERPER_API_KEY=your_key_here`
3. No code changes needed for existing integrations (API remains compatible)

### Added
- Initial project documentation
  - Product Requirements Document
  - Engineering Design Document
  - Architecture documentation
  - Project Status tracking
  - CLAUDE.md project memory

### Planned
- Project initialization (Milestone 1)

---

*This changelog will be updated as development progresses.*
