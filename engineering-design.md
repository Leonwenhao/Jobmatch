# Engineering Design Document: JobMatch

## Overview

This document outlines the technical architecture, stack decisions, and implementation plan for JobMatch—a web application that matches job seekers with relevant job postings based on their resume.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | Full-stack React, great DX, Vercel-native |
| **Language** | TypeScript | Type safety, better tooling, fewer bugs |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **Hosting** | Vercel | Seamless Next.js deployment, good free tier |
| **Payments** | Stripe Checkout | Industry standard, guest checkout support |
| **Resume Parsing** | Claude API (Anthropic) | Best-in-class document understanding |
| **Job Data** | Adzuna API | Free tier available, good US coverage, structured data |
| **Email** | Resend | Simple API, great deliverability, developer-friendly |
| **File Upload** | Vercel Blob or in-memory | Temporary storage for resume processing |
| **Database** | None (V1) | Stateless design—process and deliver, no persistence needed |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Homepage   │───▶│   Upload    │───▶│  Stripe Checkout    │ │
│  │             │    │   Resume    │    │  (Hosted by Stripe) │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                   │             │
│                                                   ▼             │
│                                        ┌─────────────────────┐ │
│                                        │   Results Page      │ │
│                                        │   (Top 5 Jobs)      │ │
│                                        └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Next.js API Routes)                │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ POST /upload    │    │ POST /webhook   │                    │
│  │ (Store resume   │    │ (Stripe event)  │                    │
│  │  temporarily)   │    │                 │                    │
│  └─────────────────┘    └────────┬────────┘                    │
│                                  │                              │
│                                  ▼                              │
│                    ┌─────────────────────────┐                 │
│                    │   Process Payment       │                 │
│                    │   1. Parse resume (AI)  │                 │
│                    │   2. Query job API      │                 │
│                    │   3. Return top 5       │                 │
│                    │   4. Queue email (20)   │                 │
│                    └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │  Claude   │   │  Adzuna   │   │  Resend   │
       │   API     │   │   API     │   │  (Email)  │
       │ (Parse)   │   │  (Jobs)   │   │           │
       └───────────┘   └───────────┘   └───────────┘
```

---

## API Design

### Endpoints

#### `POST /api/upload`
Upload resume for processing.

**Request:**
```
Content-Type: multipart/form-data
Body: { file: PDF }
```

**Response:**
```json
{
  "sessionId": "uuid-here",
  "message": "Resume uploaded successfully"
}
```

**Notes:**
- Generates a unique session ID
- Stores resume temporarily (memory or Vercel Blob)
- Returns session ID for Stripe checkout metadata

---

#### `POST /api/create-checkout`
Create Stripe checkout session.

**Request:**
```json
{
  "sessionId": "uuid-from-upload",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Notes:**
- Creates Stripe Checkout session with session ID in metadata
- Redirects user to Stripe hosted checkout
- Success URL includes session ID for results page

---

#### `POST /api/webhook`
Stripe webhook handler.

**Request:** Stripe webhook payload

**Actions on `checkout.session.completed`:**
1. Retrieve session ID from metadata
2. Get stored resume
3. Parse resume with Claude API
4. Query Adzuna API with extracted criteria
5. Store results temporarily
6. Queue email with remaining 20 jobs
7. Delete resume from storage

---

#### `GET /api/results/[sessionId]`
Fetch instant results for display.

**Response:**
```json
{
  "status": "ready",
  "jobs": [
    {
      "title": "Software Engineer",
      "company": "Acme Inc",
      "location": "New York, NY",
      "url": "https://...",
      "salary": "$80,000 - $100,000"
    }
    // ... 4 more
  ],
  "emailStatus": "queued"
}
```

---

## Data Flow

### Resume Parsing (Claude API)

**Prompt structure:**
```
You are a resume parser. Extract the following information from this resume:

1. Job titles/roles the person has held
2. Skills (technical and soft)
3. Years of experience (total)
4. Current location or stated location preference
5. Industries they've worked in
6. Education level and field
7. Job type preferences (if stated): full-time, part-time, contract, remote

Return as JSON:
{
  "jobTitles": ["Title 1", "Title 2"],
  "skills": ["Skill 1", "Skill 2"],
  "yearsExperience": 5,
  "location": "City, State",
  "industries": ["Industry 1"],
  "education": "Bachelor's in X",
  "jobTypes": ["full-time", "remote"]
}

If information is not available, use null or empty array.

Resume content:
[RESUME TEXT HERE]
```

**PDF handling:**
- Use `pdf-parse` or similar library to extract text from PDF
- Send extracted text to Claude API
- Handle PDFs that are image-based (OCR may be needed in future)

---

### Job Search (Adzuna API)

**API Details:**
- Base URL: `https://api.adzuna.com/v1/api/jobs/us/search/1`
- Auth: App ID + App Key (in query params)
- Free tier: 250 requests/day
- Returns: 10 results per page by default

**Query Parameters:**
```
what: {job titles and skills}
where: {location}
category: {mapped from industries}
full_time: 1 (if applicable)
permanent: 1 (if applicable)
results_per_page: 25
```

**Mapping logic:**
- Combine top 2-3 job titles with top skills for `what` parameter
- Use extracted location for `where`
- May need multiple queries to get diverse results

---

### Email Delivery (Resend)

**Trigger:** After results are ready, queue email job

**Email content:**
```
Subject: Your 20 Job Matches Are Ready 🎯

Hi,

Here are 20 more jobs matched to your resume:

1. [Job Title] at [Company]
   📍 [Location]
   🔗 [Apply Link]

2. ...

Good luck with your search!

— JobMatch
```

**Considerations:**
- Send from verified domain (e.g., jobs@jobmatch.com)
- Plain text + HTML versions
- Unsubscribe link (legally required, even for transactional)

---

## File Structure

```
jobmatch/
├── app/
│   ├── page.tsx                 # Homepage with upload
│   ├── checkout/
│   │   └── page.tsx             # Pre-checkout confirmation
│   ├── results/
│   │   └── [sessionId]/
│   │       └── page.tsx         # Results display
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts         # Resume upload handler
│   │   ├── create-checkout/
│   │   │   └── route.ts         # Stripe checkout creation
│   │   ├── webhook/
│   │   │   └── route.ts         # Stripe webhook handler
│   │   └── results/
│   │       └── [sessionId]/
│   │           └── route.ts     # Fetch results
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── UploadForm.tsx           # Drag-and-drop resume upload
│   ├── JobCard.tsx              # Individual job listing display
│   ├── JobList.tsx              # List of job cards
│   └── LoadingState.tsx         # Processing indicator
├── lib/
│   ├── claude.ts                # Claude API integration
│   ├── adzuna.ts                # Adzuna API integration
│   ├── stripe.ts                # Stripe helpers
│   ├── resend.ts                # Email sending
│   ├── storage.ts               # Temporary file storage
│   └── types.ts                 # TypeScript types
├── emails/
│   └── JobResults.tsx           # React Email template (if using)
├── public/
│   └── ...
├── .env.example
├── .env.local                   # (gitignored)
├── CLAUDE.md
├── docs/
│   ├── architecture.md
│   ├── changelog.md
│   └── project-status.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Environment Variables

```bash
# .env.example

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Adzuna
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Resume data privacy | Delete after processing (within request or max 24h) |
| Payment security | Stripe handles all card data, no PCI scope |
| API key exposure | Server-side only, never in client code |
| Webhook authenticity | Verify Stripe signature on all webhooks |
| File upload abuse | Validate file type, limit file size (5MB max) |
| Rate limiting | Consider adding rate limits to prevent abuse |

---

## Error Handling Strategy

| Error | User Message | Backend Action |
|-------|--------------|----------------|
| Invalid PDF | "Please upload a valid PDF file" | Reject upload |
| Empty resume | "We couldn't find enough information in your resume" | Refund or retry option |
| Claude API failure | "We're having trouble processing your resume. Please try again." | Log, alert, retry |
| Adzuna API failure | "We're having trouble finding jobs right now. We'll email your results when ready." | Retry, fallback, manual review |
| Stripe webhook failure | (Silent to user) | Log, retry, alert admin |
| Email send failure | (Silent to user) | Retry with backoff, alert admin |
| No jobs found | "We couldn't find matches for your profile right now. We'll email you if we find relevant jobs." | Consider refund |

---

## Performance Considerations

- **Resume parsing:** ~2-5 seconds (Claude API)
- **Job search:** ~1-2 seconds (Adzuna API)
- **Total processing:** ~5-10 seconds
- **User experience:** Show loading state, display results as soon as ready

**Optimization opportunities (future):**
- Cache common job searches
- Background processing for email jobs
- Batch API calls if volume increases

---

## Development Milestones

### Milestone 1: Core Infrastructure
- [ ] Next.js project setup with TypeScript
- [ ] Tailwind configuration
- [ ] Basic homepage with upload UI
- [ ] File upload API endpoint
- [ ] Environment variables configured

### Milestone 2: Resume Parsing
- [ ] PDF text extraction
- [ ] Claude API integration
- [ ] Resume parsing prompt refinement
- [ ] Structured data output

### Milestone 3: Job Search
- [ ] Adzuna API integration
- [ ] Search query construction from parsed resume
- [ ] Results formatting
- [ ] Job card component

### Milestone 4: Payment Flow
- [ ] Stripe Checkout integration
- [ ] Webhook handler
- [ ] Success/cancel redirects
- [ ] Session management

### Milestone 5: Email Delivery
- [ ] Resend integration
- [ ] Email template design
- [ ] Delivery queue
- [ ] Error handling

### Milestone 6: Polish & Deploy
- [ ] Error states and edge cases
- [ ] Loading states and UX
- [ ] Mobile responsiveness
- [ ] Production environment setup
- [ ] Domain and DNS
- [ ] Go live

---

## Testing Strategy

| Type | What to Test |
|------|--------------|
| **Unit** | Resume parsing logic, job query construction |
| **Integration** | API endpoints, Stripe webhook flow |
| **E2E** | Full user flow: upload → pay → results |
| **Manual** | Various resume formats, edge cases |

---

## Monitoring & Observability (Post-Launch)

- Vercel Analytics (built-in)
- Error tracking (Sentry or similar)
- Stripe Dashboard for payment monitoring
- Resend Dashboard for email delivery

---

## Open Technical Questions

1. **Temporary storage:** Use Vercel Blob (persistent) or in-memory (simpler but lost on restart)?
2. **Session management:** Simple UUID + in-memory map, or lightweight KV store?
3. **Rate limiting:** Implement from day 1 or add when needed?
4. **Image-based PDFs:** Support OCR for scanned resumes in V1 or defer?

---

*Document Version: 1.0*
*Last Updated: [Date]*
*Status: Ready for Development*
