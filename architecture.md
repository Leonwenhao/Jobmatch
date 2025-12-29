# Architecture: JobMatch

## System Overview

JobMatch is a stateless web application that processes resumes and returns matched job listings. There is no database in V1—all processing happens in a single request/response cycle with email as async follow-up.

---

## High-Level Flow

```
User                    Frontend                   Backend                    External Services
 │                         │                          │                              │
 │  1. Upload resume       │                          │                              │
 │────────────────────────▶│                          │                              │
 │                         │  2. POST /api/upload     │                              │
 │                         │─────────────────────────▶│                              │
 │                         │                          │  3. Store temporarily        │
 │                         │                          │─────────────────────────────▶│
 │                         │  4. Return sessionId     │                              │
 │                         │◀─────────────────────────│                              │
 │                         │                          │                              │
 │  5. Enter email, pay    │                          │                              │
 │────────────────────────▶│                          │                              │
 │                         │  6. POST /create-checkout│                              │
 │                         │─────────────────────────▶│                              │
 │                         │                          │  7. Create Stripe session    │
 │                         │                          │─────────────────────────────▶│ Stripe
 │                         │  8. Redirect to Stripe   │                              │
 │                         │◀─────────────────────────│                              │
 │                         │                          │                              │
 │  9. Complete payment    │                          │                              │
 │─────────────────────────────────────────────────────────────────────────────────▶│ Stripe
 │                         │                          │                              │
 │                         │                          │  10. Webhook: payment done   │
 │                         │                          │◀─────────────────────────────│ Stripe
 │                         │                          │                              │
 │                         │                          │  11. Parse resume            │
 │                         │                          │─────────────────────────────▶│ Claude API
 │                         │                          │◀─────────────────────────────│
 │                         │                          │                              │
 │                         │                          │  12. Search jobs             │
 │                         │                          │─────────────────────────────▶│ Serper API
 │                         │                          │◀─────────────────────────────│
 │                         │                          │                              │
 │                         │                          │  13. Store results (temp)    │
 │                         │                          │─────────────────────────────▶│
 │                         │                          │                              │
 │                         │                          │  14. Send email (20 jobs)    │
 │                         │                          │─────────────────────────────▶│ Resend
 │                         │                          │                              │
 │ 15. Redirect to results │                          │                              │
 │◀────────────────────────────────────────────────────                              │
 │                         │                          │                              │
 │  16. Fetch results      │                          │                              │
 │────────────────────────▶│  GET /api/results/[id]   │                              │
 │                         │─────────────────────────▶│                              │
 │  17. Display 5 jobs     │◀─────────────────────────│                              │
 │◀────────────────────────│                          │                              │
 │                         │                          │                              │
 │  18. Receive email      │                          │                              │
 │◀────────────────────────────────────────────────────────────────────────────────── │ Email
```

---

## Component Architecture

### Frontend (Next.js App Router)

```
app/
├── page.tsx                    # Homepage
│   └── <UploadForm />          # Drag-drop resume upload
│
├── checkout/page.tsx           # Pre-payment confirmation
│   └── Shows email input + price
│   └── Redirects to Stripe
│
├── results/[sessionId]/page.tsx # Results display
│   └── <JobList />             # Container for job cards
│       └── <JobCard />         # Individual job listing
│   └── <EmailNotice />         # "More jobs coming to email"
│
└── api/                        # API Routes (serverless)
    ├── upload/route.ts
    ├── create-checkout/route.ts
    ├── webhook/route.ts
    └── results/[sessionId]/route.ts
```

### Backend (Next.js API Routes)

All backend logic runs in Vercel serverless functions:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/upload` | POST | Accept resume, return session ID |
| `/api/create-checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe events, trigger processing |
| `/api/results/[sessionId]` | GET | Return processed job results |

### Library Modules

```
lib/
├── claude.ts      # Resume parsing with Claude API
├── job-search.ts  # Job search queries (Serper/Google)
├── stripe.ts      # Checkout and webhook helpers
├── resend.ts      # Email delivery
├── storage.ts     # Temporary file/data storage
└── types.ts       # Shared TypeScript types
```

---

## Data Models

### Session (In-Memory or Temp Storage)

```typescript
interface Session {
  id: string;                    // UUID
  email: string;
  resumeText: string;            // Extracted PDF text
  parsedResume: ParsedResume;    // Structured data from Claude
  jobs: Job[];                   // Matched jobs
  status: 'pending' | 'paid' | 'processing' | 'complete' | 'failed';
  createdAt: Date;
}
```

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
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salary?: string;
  description?: string;
  source: 'Ashby' | 'Greenhouse' | 'Lever' | 'Workable' | 'Paylocity' | 'SmartRecruiters' | 'Job Board';
}
```

---

## External Service Integration

### Claude API (Resume Parsing)

- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-20250514` (or latest)
- **Input:** Extracted PDF text
- **Output:** Structured ParsedResume JSON
- **Latency:** ~2-5 seconds

### Serper API (Job Search via Google)

- **Base URL:** `https://google.serper.dev/search`
- **Auth:** API key in X-API-KEY header
- **Rate Limit:** 2500 searches/month (free tier)
- **Results:** 25 per request (configurable)
- **Job Boards:** Ashby, Greenhouse, Lever, Workable, Paylocity, SmartRecruiters

### Stripe (Payments)

- **Mode:** Stripe Checkout (hosted payment page)
- **Flow:** Create session → Redirect → Webhook on completion
- **Metadata:** Session ID passed through for correlation

### Resend (Email)

- **Endpoint:** `https://api.resend.com/emails`
- **Auth:** API key in header
- **Template:** HTML email with job listings

---

## Storage Strategy (V1)

Since V1 has no database, we use temporary in-memory or short-lived storage:

**Option A: In-Memory Map**
```typescript
const sessions = new Map<string, Session>();
```
- Simple, no setup
- Lost on server restart (acceptable for V1)
- Fine for Vercel's short-lived serverless model

**Option B: Vercel KV**
- Redis-based key-value store
- Persists across function invocations
- Small free tier
- Better for reliability

**Recommendation:** Start with in-memory, move to Vercel KV if needed.

---

## Error Handling

| Failure Point | Impact | Recovery |
|---------------|--------|----------|
| PDF parsing fails | Can't extract text | Show error, suggest different file |
| Claude API down | Can't parse resume | Retry, then refund |
| Job search API down | Can't find jobs | Retry, queue for later, refund |
| Stripe webhook fails | Payment received but not processed | Retry mechanism, manual review |
| Email fails | User doesn't get full results | Retry queue, support contact |

---

## Security Model

1. **No PCI scope** — Stripe handles all payment data
2. **Resume privacy** — Deleted after processing (never stored long-term)
3. **API keys** — Server-side only, environment variables
4. **Webhook validation** — Verify Stripe signatures
5. **File validation** — Check MIME type, limit size

---

## Scalability Notes (Future)

V1 is designed for low-to-moderate traffic. If scale increases:

1. **Add database** — Move from in-memory to persistent storage
2. **Background jobs** — Process heavy tasks async (e.g., Vercel Cron, Inngest)
3. **Caching** — Cache common job queries
4. **Rate limiting** — Protect against abuse
5. **CDN** — Already handled by Vercel

---

*Last Updated: [Date]*
