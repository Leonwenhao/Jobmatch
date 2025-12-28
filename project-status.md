# Project Status: JobMatch

## Current Phase
**Phase 2: Setup** — Preparing to begin development

---

## Milestones Overview

| # | Milestone | Status | Notes |
|---|-----------|--------|-------|
| 1 | Core Infrastructure | ⏳ Not Started | Next.js, Tailwind, upload UI |
| 2 | Resume Parsing | ⏳ Not Started | PDF extraction, Claude API |
| 3 | Job Search | ⏳ Not Started | Adzuna integration |
| 4 | Payment Flow | ⏳ Not Started | Stripe Checkout |
| 5 | Email Delivery | ⏳ Not Started | Resend integration |
| 6 | Polish & Deploy | ⏳ Not Started | Error handling, UX, launch |

---

## Milestone Details

### Milestone 1: Core Infrastructure
**Goal:** Project skeleton with working upload UI

- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Create homepage layout
- [ ] Build drag-and-drop upload component
- [ ] Create `/api/upload` endpoint
- [ ] Set up environment variables structure
- [ ] Create basic file structure per engineering design

### Milestone 2: Resume Parsing
**Goal:** Extract structured data from uploaded resumes

- [ ] Implement PDF text extraction
- [ ] Set up Claude API integration
- [ ] Write and test parsing prompt
- [ ] Handle edge cases (empty resume, image-based PDF)
- [ ] Return structured JSON with job info

### Milestone 3: Job Search
**Goal:** Find matching jobs from Adzuna

- [ ] Set up Adzuna API integration
- [ ] Build query constructor from parsed resume
- [ ] Fetch and format job results
- [ ] Create JobCard and JobList components
- [ ] Handle "no results" case

### Milestone 4: Payment Flow
**Goal:** Accept payment via Stripe

- [ ] Integrate Stripe Checkout
- [ ] Create checkout session with metadata
- [ ] Build webhook handler
- [ ] Implement success/cancel pages
- [ ] Connect payment to job processing

### Milestone 5: Email Delivery
**Goal:** Send remaining jobs via email

- [ ] Set up Resend integration
- [ ] Design email template
- [ ] Implement email queue/sending
- [ ] Handle delivery failures

### Milestone 6: Polish & Deploy
**Goal:** Production-ready and live

- [ ] Add loading states and animations
- [ ] Implement all error states
- [ ] Mobile responsiveness pass
- [ ] Set up production environment
- [ ] Configure domain
- [ ] Deploy to Vercel
- [ ] Test full flow end-to-end
- [ ] Launch 🚀

---

## Completed Work
*Nothing yet—development starting soon*

---

## Blockers & Open Questions

1. **Product name:** "JobMatch" is a placeholder. Final name TBD.
2. **Temporary storage:** Vercel Blob vs in-memory? Decide in Milestone 1.
3. **OCR for scanned PDFs:** Defer to post-V1 or include?

---

## Next Actions
1. Complete Phase 2 setup (GitHub repo, MCP servers, etc.)
2. Begin Milestone 1 with Claude Code

---

*Last Updated: [Date]*
