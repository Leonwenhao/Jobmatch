# Project Status: JobMatch

## Current Phase
**Phase 4: Production** — JobMatch V1 is live!

**Production URL:** https://jobmatch-mu.vercel.app

---

## Milestones Overview

| # | Milestone | Status | Notes |
|---|-----------|--------|-------|
| 1 | Core Infrastructure | ✅ Complete | Next.js, Tailwind, upload UI |
| 2 | Resume Parsing | ✅ Complete | Claude API direct PDF parsing |
| 3 | Job Search | ✅ Complete | Google Custom Search API |
| 4 | Payment Flow | ✅ Complete | Stripe Checkout |
| 5 | Email Delivery | ✅ Complete | Resend integration |
| 6 | Polish & Deploy | ✅ Complete | Production deployed |

---

## Recent Updates (December 29, 2025)

### Bug Fix: "No Matches Found" Issue Resolved
- **Root Cause:** Stripe webhook not configured + wrong API keys
- **Fix:** Configured webhook in Test mode + added fallback search in results endpoint
- **Lesson:** Check external service configuration BEFORE debugging code
- See `docs/POST-MORTEM-2025-12-29.md` for full analysis

### Infrastructure Changes
- **Session Storage:** Upgraded from in-memory to Upstash Redis
- **Job Search:** Migrated from Adzuna → Serper → Google Custom Search API
- **Fallback Logic:** Results endpoint now runs search if webhook fails

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Payments | Stripe Checkout |
| Resume Parsing | Claude API (Anthropic) |
| Job Search | Google Custom Search API |
| Session Storage | Upstash Redis |
| Email | Resend |

---

## Environment Variables Required

```bash
# Stripe (use Test or Live keys consistently)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Google Custom Search
GOOGLE_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...

# Upstash Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Resend Email
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=https://jobmatch-mu.vercel.app
```

---

## Critical Configuration

### Stripe Webhook (REQUIRED)
- URL: `https://jobmatch-mu.vercel.app/api/webhook`
- Event: `checkout.session.completed`
- **Test and Live mode have separate webhooks!**

---

## Known Limitations

1. **Google CSE Quota:** 100 queries/day on free tier
2. **Resend Free Tier:** 100 emails/day
3. **Session TTL:** 2 hours in Redis

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Project overview and notes
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [BUGFIXES.md](./BUGFIXES.md) - Bug fix history
- [docs/changelog.md](./docs/changelog.md) - Version history
- [docs/POST-MORTEM-2025-12-29.md](./docs/POST-MORTEM-2025-12-29.md) - Debugging lessons

---

*Last Updated: December 29, 2025*
