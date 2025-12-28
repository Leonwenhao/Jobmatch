# JobMatch

## Goal
A web app where job seekers upload their resume, pay $5, and receive 25 curated job postings—5 instantly, 20 via email. No account required.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **Payments:** Stripe Checkout (guest mode)
- **Resume Parsing:** Claude API (Anthropic)
- **Job Data:** Adzuna API
- **Email:** Resend

## Architecture Overview
Stateless flow: Upload → Pay → Process → Deliver. No database in V1.
See [docs/architecture.md](./docs/architecture.md) for full system design.

## Constraints & Policies
- Never commit `.env` or any secrets
- Always use environment variables for API keys
- Never push directly to `main` branch
- All features go through PR review
- Delete uploaded resumes after processing (privacy)

## Branch Naming
- Features: `feature/description`
- Fixes: `fix/description`
- Chores: `chore/description`

## Key Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

## Documentation
- [Product Requirements](./docs/product-requirements.md)
- [Engineering Design](./docs/engineering-design.md)
- [Architecture](./docs/architecture.md)
- [Changelog](./docs/changelog.md)
- [Project Status](./docs/project-status.md)

## Current Focus
Setting up project infrastructure (Milestone 1)

## Notes for Claude
- This is a V1 MVP—keep it simple, ship fast
- Target user is stressed job seekers—UX should be calming and clear
- Mobile responsiveness is important
- When in doubt, refer to product-requirements.md
