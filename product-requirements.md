# Product Requirements Document: JobMatch

## Overview

**Product Name:** JobMatch (working title)

**One-liner:** Upload your resume, get 25 jobs you're actually qualified for.

**Problem Statement:** 
Job searching is exhausting. Seekers spend hours scrolling through listings that don't match their experience, applying to hundreds of jobs with low response rates. The current job market is brutal—people need a faster way to find relevant opportunities without the grind.

**Solution:** 
A frictionless tool where users upload their resume, pay a small fee, and receive a curated list of job postings matched to their actual qualifications. No account required. No endless scrolling. Just relevant jobs, delivered.

---

## Target User

**Primary audience:** Job seekers in the United States

**Demographics:**
- All experience levels (entry-level to senior)
- All industries (not just tech—includes retail, healthcare, trades, hospitality, etc.)
- People actively job hunting who are frustrated with the current process
- Budget-conscious (likely unemployed or underemployed)

**User mindset:**
- Tired and stressed from job searching
- Skeptical of "too good to be true" solutions
- Wants immediate value, not another account to manage
- Willing to pay a small amount if it genuinely saves time

---

## Core User Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. LAND                                                │
│     User arrives at homepage                            │
│     Sees clear value prop: "Upload resume, get jobs"    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. UPLOAD                                              │
│     User uploads resume (PDF)                           │
│     Minimal friction—no forms, no account               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. PAY                                                 │
│     User sees price ($5)                                │
│     Clicks "Find My Jobs"                               │
│     Stripe Checkout (guest checkout, no account)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. PROCESS                                             │
│     AI extracts from resume:                            │
│     - Job titles / roles                                │
│     - Skills (technical and soft)                       │
│     - Years of experience                               │
│     - Location / relocation preferences                 │
│     - Industries                                        │
│     - Education                                         │
│     Job API queried with extracted criteria             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. INSTANT RESULTS                                     │
│     User sees top 5 matches immediately on results page │
│     Each listing shows: title, company, location, link  │
│     User can start applying while waiting for rest      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  6. EMAIL DELIVERY                                      │
│     Remaining 20 jobs sent via email                    │
│     Delivered within 15-30 minutes                      │
│     Clean, formatted list with apply links              │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Requirements

### Must Have (V1)

| Feature | Description | Priority |
|---------|-------------|----------|
| Resume upload | Accept PDF uploads, validate file type | P0 |
| Resume parsing | Extract relevant info using AI (Claude API) | P0 |
| Job matching | Query job API with extracted criteria | P0 |
| Instant results | Display top 5 jobs immediately after payment | P0 |
| Email delivery | Send remaining 20 jobs to user's email | P0 |
| Payment | Stripe Checkout, guest mode, $5 one-time | P0 |
| Mobile responsive | Works on phone (many job seekers use mobile) | P0 |
| Error handling | Clear messages if resume can't be parsed, payment fails, etc. | P0 |

### Not in V1 (Future Considerations)

| Feature | Description | Target Version |
|---------|-------------|----------------|
| User accounts | Save searches, view history | V2 |
| Resume builder | Help users create/improve resumes | V2 |
| Cover letter generator | AI-written cover letters per job | V2 |
| Application autofill | Auto-complete job applications | V3 |
| International jobs | Expand beyond US | V2 |
| Salary filtering | Filter by compensation range | V2 |
| Job alerts | Notify when new matching jobs appear | V2 |
| Bulk pricing | Discounts for multiple searches | V2 |

---

## Job Matching Criteria

The AI should extract and use the following from the resume:

| Criteria | How It's Used |
|----------|---------------|
| **Job titles** | Search for same/similar titles |
| **Skills** | Match required skills in listings |
| **Experience level** | Filter by seniority (entry, mid, senior) |
| **Location** | Search jobs in user's area or stated preference |
| **Industry** | Prioritize relevant industries |
| **Education** | Factor in for roles that require specific degrees |
| **Job type** | Include full-time, part-time, contract, freelance |

**Matching philosophy:** Cast a reasonably wide net. It's better to surface a relevant job the user didn't think of than to be too narrow and miss opportunities.

---

## Pricing

**Model:** One-time payment per search

**Price:** $5.00 USD

**Rationale:**
- Low barrier for budget-conscious job seekers
- Covers API and infrastructure costs with healthy margin
- Not so cheap it signals low quality
- Simple, no subscription complexity

**Payment method:** Credit/debit card via Stripe

**Refund policy:** No refunds (digital service delivered immediately). Consider goodwill refunds for genuine issues.

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Conversion rate | 5%+ | Visitors → Paid users |
| Completion rate | 95%+ | Paid users who receive results |
| Email delivery | < 30 min | Time from payment to email received |
| User satisfaction | 4+ stars | Post-delivery feedback (optional) |
| Support tickets | < 5% | Users who contact with issues |

---

## Content & Copy

### Homepage
- Headline: Clear, benefit-focused (e.g., "Stop Scrolling. Start Applying.")
- Subhead: Explain the value prop in one sentence
- Social proof: If available, show testimonials or numbers
- Trust signals: Secure payment, privacy respected
- Clear CTA: Upload resume button

### Results Page
- Congratulations/positive reinforcement
- Top 5 jobs displayed with key info
- Clear indication that more are coming via email
- Each job: Title, Company, Location, "Apply" link

### Email
- Subject: "Your 20 job matches are ready"
- Clean, scannable format
- Jobs listed with title, company, location, link
- Brief footer with support contact

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid file type | "Please upload a PDF file" |
| Resume too short/empty | "We couldn't extract enough info. Please upload a resume with your work history." |
| Resume parsing fails | "We had trouble reading your resume. Please try a different file or contact support." |
| Payment fails | Stripe handles, user can retry |
| No jobs found | Rare, but: "We couldn't find matches right now. We'll email you if we find relevant jobs, or contact us for a refund." |
| Email delivery fails | Retry logic, alert admin, manual intervention |

---

## Privacy & Data Handling

- Resumes are processed and not stored long-term (delete after processing or within 24 hours)
- Email addresses used only for job delivery, not marketing (unless opted in)
- No accounts = minimal data retention
- Clear privacy policy on site

---

## Open Questions

1. **Branding:** Final product name? "JobMatch" is a placeholder.
2. **Landing page copy:** Need to write compelling copy that converts.
3. **Feedback mechanism:** Add optional thumbs up/down on results?
4. **Retry policy:** If a user is unhappy, can they retry with a different resume?

---

*Document Version: 1.0*
*Last Updated: [Date]*
*Status: Ready for Engineering Design*
