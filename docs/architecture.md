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
│  (PDF/Text)    │     │  (Stripe)     │     │  (5 + 20)     │
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
 │                         │  Search jobs (x3)      │                  │
 │                         │─────────────────────▶  │                  │
 │                         │                         │                  │
 │                         │  Job results           │                  │
 │                         │◀─────────────────────  │                  │
 │                         │                         │                  │
 │                         │  Send email (20 jobs)  │                  │
 │                         │──────────────────────────────────────▶  │
 │                         │                         │                  │
 │                         │  Store 25 jobs         │                  │
 │                         │  Mark complete         │                  │
```

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
 │  { jobs: [...5], status }
 │◀─────────────────────  │
 │                         │
 │  Display jobs          │
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/upload` | POST | Resume upload and parsing |
| `/api/create-checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe payment events |
| `/api/results/[sessionId]` | GET | Fetch job results |

## Storage

**In-Memory Session Storage (V1 MVP)**

- No database required
- Sessions stored in Map with 2-hour TTL
- Auto-cleanup of expired sessions
- Stateless design for serverless deployment

```typescript
Map<sessionId, {
  id: string,
  email: string,
  parsedResume: ParsedResume,
  jobs: Job[],
  status: 'pending' | 'processing' | 'complete' | 'failed',
  createdAt: Date
}>
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
