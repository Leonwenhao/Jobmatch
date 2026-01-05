# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Journey                               │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Upload Resume │ ──▶ │  Pay $5       │ ──▶ │  Get Jobs     │
│  (PDF)         │     │  (Stripe)     │     │  (All 25)     │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js App (Vercel)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Pages (app/)   │  │   API Routes     │  │   Components     │  │
│  │                  │  │                  │  │                  │  │
│  │  - /            │  │  - /api/upload   │  │  - JobList       │  │
│  │  - /checkout    │  │  - /api/checkout │  │  - JobCard       │  │
│  │  - /success     │  │  - /api/webhook  │  │  - FileUpload    │  │
│  │  - /results/[id]│  │  - /api/results  │  │  - LoadingState  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Library (lib/)                           │  │
│  │                                                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  │
│  │  │ job-search  │ │   claude    │ │   stripe    │             │  │
│  │  │ (Google CSE)│ │ (parsing)   │ │ (payments)  │             │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │  │
│  │                                                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  │
│  │  │   storage   │ │   resend    │ │   types     │             │  │
│  │  │ (in-memory) │ │  (email)    │ │             │             │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Phase 1: Upload & Parse
```
User                    Next.js                  Claude API
 │                         │                         │
 │  POST /api/upload      │                         │
 │  (PDF resume)          │                         │
 │─────────────────────▶  │                         │
 │                         │  Parse resume (PDF)    │
 │                         │─────────────────────▶  │
 │                         │                         │
 │                         │  ParsedResume          │
 │                         │◀─────────────────────  │
 │                         │                         │
 │  { sessionId }         │  Store in memory        │
 │◀─────────────────────  │                         │
```

### Phase 2: Checkout
```
User                    Next.js                  Stripe
 │                         │                         │
 │  POST /api/checkout    │                         │
 │  { sessionId, email }  │                         │
 │─────────────────────▶  │                         │
 │                         │  Create checkout       │
 │                         │─────────────────────▶  │
 │                         │                         │
 │                         │  { checkoutUrl }       │
 │                         │◀─────────────────────  │
 │                         │                         │
 │  Redirect to Stripe    │                         │
 │◀─────────────────────  │                         │
 │                         │                         │
 │  Complete payment      │                         │
 │─────────────────────────────────────────────▶  │
```

### Phase 3: Job Search & Delivery
```
Stripe                  Next.js                  Google CSE         Resend
 │                         │                         │                  │
 │  Webhook               │                         │                  │
 │  (payment complete)    │                         │                  │
 │─────────────────────▶  │                         │                  │
 │                         │                         │                  │
 │                         │  Search jobs           │                  │
 │                         │  (3-tier strategy)     │                  │
 │                         │─────────────────────▶  │                  │
 │                         │                         │                  │
 │                         │  Job results (≤25)     │                  │
 │                         │◀─────────────────────  │                  │
 │                         │                         │                  │
 │                         │  Email ALL jobs        │                  │
 │                         │  (as receipt/backup)   │                  │
 │                         │──────────────────────────────────────▶  │
 │                         │                         │                  │
 │                         │  Store all jobs        │                  │
 │                         │  Mark complete         │                  │
```

**3-Tier Search Strategy:**
1. Parallel queries for top 3 job titles + location
2. Retry without location filter if below target
3. Broader search with skills-based fallback terms

### Phase 4: Results Display
```
User                    Next.js
 │                         │
 │  GET /results/[id]     │
 │─────────────────────▶  │
 │                         │
 │  Poll every 2s         │
 │─────────────────────▶  │
 │                         │
 │  { jobs: [...ALL], status }
 │◀─────────────────────  │
 │                         │
 │  Display ALL jobs      │
 │  (up to 25 jobs)       │
```

**Note:** All jobs are displayed on the results page. Email serves as a receipt/backup copy.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/upload` | POST | Resume upload and parsing |
| `/api/create-checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe payment events |
| `/api/results/[sessionId]` | GET | Fetch job results |

## Storage

**Upstash Redis Session Storage**

- Serverless Redis for session persistence
- Sessions stored with 2-hour TTL
- Backup recovery from Stripe metadata if Redis session expires
- Works across serverless function instances

```typescript
Session: {
  id: string,
  email: string,
  parsedResume: ParsedResume,
  jobs: Job[],
  status: 'pending' | 'processing' | 'complete' | 'failed',
  createdAt: Date
}
```

## External Services

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| Claude API | Resume parsing | Standard API limits |
| Google Custom Search | Job search | 100/day free, then $5/1000 |
| Stripe | Payment processing | Standard limits |
| Resend | Email delivery | Free tier: 100/day |

## Deployment

- **Platform:** Vercel
- **Runtime:** Node.js (Edge compatible)
- **Environment:** Production environment variables via Vercel dashboard
