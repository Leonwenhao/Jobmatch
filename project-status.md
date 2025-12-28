# Project Status: JobMatch

## Current Phase
**Phase 3: Active Development** — Building JobMatch V1

---

## Milestones Overview

| # | Milestone | Status | Notes |
|---|-----------|--------|-------|
| 1 | Core Infrastructure | ✅ Complete | Next.js, Tailwind, upload UI |
| 2 | Resume Parsing | ✅ Complete | PDF extraction, Claude API |
| 3 | Job Search | ⏳ Not Started | Adzuna integration |
| 4 | Payment Flow | ⏳ Not Started | Stripe Checkout |
| 5 | Email Delivery | ⏳ Not Started | Resend integration |
| 6 | Polish & Deploy | ⏳ Not Started | Error handling, UX, launch |

---

## Milestone Details

### Milestone 1: Core Infrastructure ✅
**Goal:** Project skeleton with working upload UI

- [x] Initialize Next.js project with TypeScript
- [x] Configure Tailwind CSS
- [x] Create homepage layout
- [x] Build drag-and-drop upload component
- [x] Create `/api/upload` endpoint
- [x] Set up environment variables structure
- [x] Create basic file structure per engineering design

### Milestone 2: Resume Parsing ✅
**Goal:** Extract structured data from uploaded resumes

- [x] Implement PDF text extraction
- [x] Set up Claude API integration
- [x] Write and test parsing prompt
- [x] Handle edge cases (empty resume, image-based PDF)
- [x] Return structured JSON with job info

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

### Milestone 1: Core Infrastructure (Dec 28, 2025)
- ✅ Next.js 14 project initialized with TypeScript
- ✅ Tailwind CSS configured with custom theme
- ✅ File structure created (app/, components/, lib/, emails/, public/)
- ✅ Homepage with hero section and "How It Works"
- ✅ Drag-and-drop resume upload component with validation
- ✅ `/api/upload` endpoint with PDF parsing (pdf-parse)
- ✅ In-memory session storage (lib/storage.ts)
- ✅ TypeScript types defined (lib/types.ts)
- ✅ Environment variables structure (.env.example)
- ✅ Build successful, dev server running

### Milestone 2: Resume Parsing (Dec 28, 2025)
- ✅ PDF text extraction with pdf-parse
- ✅ Claude API integration (lib/claude.ts)
- ✅ Resume parsing prompt based on engineering design
- ✅ Lazy initialization for Anthropic client
- ✅ Resume validation (minimum length, keyword checks)
- ✅ Structured ParsedResume JSON output
- ✅ Error handling for empty/unreadable PDFs
- ✅ Integration with /api/upload endpoint
- ✅ JSON extraction from Claude responses
- ✅ Field validation and defaults

---

## Blockers & Open Questions

1. **Product name:** "JobMatch" is a placeholder. Final name TBD.
2. **Temporary storage:** ✅ Decided: Using in-memory Map for V1 (simple, stateless)
3. **OCR for scanned PDFs:** Defer to post-V1 or include?

---

## Next Actions
1. ✅ ~~Complete Phase 2 setup~~
2. ✅ ~~Begin Milestone 1~~
3. ✅ ~~Complete Milestone 2~~
4. **Start Milestone 3: Job Search**
   - Set up Adzuna API integration
   - Build query constructor from parsed resume
   - Fetch and format job results
   - Create JobCard and JobList components
   - Handle "no results" case

---

*Last Updated: December 28, 2025*
