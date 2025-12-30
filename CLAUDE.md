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
- **Job Data:** Google Custom Search API
- **Session Storage:** Upstash Redis
- **Email:** Resend

## Architecture Overview
Stateless flow: Upload → Pay → Process → Deliver.
- Session data stored in Upstash Redis (2-hour TTL)
- Backup session recovery from Stripe metadata
- See [docs/architecture.md](./docs/architecture.md) for full system design.

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
- [Deployment Guide](./DEPLOYMENT.md)
- [Bug Fixes Log](./BUGFIXES.md)
- [Post-Mortem 2025-12-29](./docs/POST-MORTEM-2025-12-29.md)

## Current Status
**Production deployed** at https://jobmatch-mu.vercel.app

## Critical Configuration Notes

### Stripe Webhook Setup (REQUIRED)
The app will NOT work without a properly configured Stripe webhook:
1. Webhook URL: `https://your-domain.com/api/webhook`
2. Event: `checkout.session.completed`
3. **Test mode and Live mode have SEPARATE webhooks** - configure both if needed
4. Webhook signing secret must match the mode you're using

### Environment Variables
All must be set in Vercel for production:
- `STRIPE_SECRET_KEY` - Must match your Stripe account
- `STRIPE_WEBHOOK_SECRET` - Must match webhook mode (Test/Live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Must match your Stripe account
- `GOOGLE_API_KEY` - For job search
- `GOOGLE_SEARCH_ENGINE_ID` - Custom Search Engine ID
- `ANTHROPIC_API_KEY` - For resume parsing
- `UPSTASH_REDIS_REST_URL` - For session storage
- `UPSTASH_REDIS_REST_TOKEN` - For session storage
- `RESEND_API_KEY` - For email delivery
- `NEXT_PUBLIC_APP_URL` - Your production URL

## Debugging Tools
- `/api/debug-search?test=true` - Test job search with sample data
- `/api/debug-search?sessionId=xxx` - Test specific session
- Vercel logs: `vercel logs https://jobmatch-mu.vercel.app`

## Notes for Claude
- This is a V1 MVP—keep it simple, ship fast
- Target user is stressed job seekers—UX should be calming and clear
- Mobile responsiveness is important
- When in doubt, refer to product-requirements.md
- **IMPORTANT:** When debugging "No matches found":
  1. First check if Stripe webhook is configured
  2. Verify Stripe API keys match the account
  3. Check webhook mode (Test vs Live)
  4. THEN check search logic
- See [POST-MORTEM-2025-12-29.md](./docs/POST-MORTEM-2025-12-29.md) for debugging lessons learned
