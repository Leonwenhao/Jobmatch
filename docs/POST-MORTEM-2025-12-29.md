# Post-Mortem: "No Matches Found" Debugging Session

**Date:** December 29, 2025
**Duration:** ~3 hours
**Outcome:** Issue resolved

---

## Summary

Users reported seeing "No Matches Found" after completing payment. The issue was ultimately caused by **missing Stripe webhook configuration** and **mismatched Stripe API keys**, NOT problems with the job search functionality.

We spent significant time investigating and changing the search API when the search was working correctly all along.

---

## Timeline of Changes

| Time | Action | Was it Necessary? |
|------|--------|-------------------|
| Start | Investigated Google CSE API | ❌ No - API was working fine |
| +30m | Added fallback search logic for empty job titles | ⚠️ Partially - Good safety net but not root cause |
| +45m | Improved Claude resume parsing prompt | ⚠️ Partially - Good improvement but not root cause |
| +1h | Added debug endpoint | ✅ Yes - This helped diagnose |
| +1.5h | Tested edge cases | ❌ No - All tests passed because search worked |
| +2h | Checked Stripe webhook | ✅ Yes - Found no webhook configured |
| +2.5h | Found wrong Stripe account | ✅ Yes - Root cause identified |
| +3h | Added results endpoint fallback | ✅ Yes - Final fix that made it work |

---

## What We Changed (That Didn't Need Changing)

### 1. Search API Changes (3 times over project history)
- Adzuna → Serper API → Google Custom Search API
- **All three worked correctly**
- We changed APIs assuming they were returning 0 results
- Reality: The search was never being called because webhook wasn't firing

### 2. Search Query Logic
- Added fallback search terms for empty job titles
- Improved query construction
- **These were unnecessary** - the original query format worked fine

### 3. Resume Parsing Prompt
- Enhanced Claude prompt to emphasize job titles
- **This was unnecessary** - Claude was parsing resumes correctly

---

## The Actual Root Causes

### Root Cause #1: No Stripe Webhook Configured
- **Impact:** Payment completed but app was never notified
- **Symptom:** Session stayed in "pending" status forever
- **Discovery:** Checked Stripe Dashboard → Webhooks → Empty

### Root Cause #2: Wrong Stripe Mode (Test vs Live)
- **Impact:** Webhook configured in Live mode, but using Test API keys
- **Symptom:** No webhook delivery attempts in Test mode
- **Discovery:** User mentioned "Sandbox mode" banner in Stripe

### Root Cause #3: Wrong Stripe Account
- **Impact:** App was using API keys from Account A, but webhook was in Account B
- **Symptom:** Keys started with `51O6leGHIK3w8` but dashboard showed `51SjrDLH3QmVTf6jq`
- **Discovery:** Compared key prefixes between .env.local and Stripe dashboard

### Root Cause #4: No Fallback in Results Endpoint
- **Impact:** If webhook failed, results page returned empty jobs
- **Symptom:** User sees "No Matches Found" even with valid session
- **Fix:** Added fallback to run job search if session exists but has no jobs

---

## Why We Didn't Find This Earlier

### 1. Misleading Error Message
"No Matches Found" suggested a search problem, not a webhook problem.

### 2. Test Data Worked
The debug endpoint returned jobs with test data, confirming search worked. But we didn't realize the production flow never reached the search.

### 3. External Configuration Wasn't Checked First
We dove into code changes before verifying:
- Is the webhook configured?
- Are API keys correct?
- Is the payment reaching our endpoint?

### 4. Assumptions Based on Past Issues
Previous issues WERE search-related (Adzuna query too complex), so we assumed this was similar.

### 5. No Visibility Into Webhook Status
The app didn't clearly log "webhook received" vs "webhook never called" - we had to infer from session status.

---

## Lessons Learned

### 1. Check External Service Configuration FIRST
Before changing any code:
- [ ] Is the Stripe webhook configured?
- [ ] Are we in the right Stripe mode (Test/Live)?
- [ ] Do API keys match the account?
- [ ] Is the webhook receiving events?

### 2. Verify the Full Flow End-to-End
Don't just test individual components. Test:
1. Upload resume
2. Complete payment
3. Check webhook was called
4. Verify jobs were searched
5. Confirm results display

### 3. Add Clear Diagnostic Logging
Each step should log clearly:
```
[UPLOAD] Session created: abc123
[CHECKOUT] Stripe session created for abc123
[WEBHOOK] Received payment for abc123  ← This was missing!
[SEARCH] Found 25 jobs for abc123
[RESULTS] Returning 5 jobs to client
```

### 4. Don't Assume Code is the Problem
When something doesn't work:
- 50% chance: Configuration issue
- 30% chance: Environment variable issue
- 20% chance: Code bug

### 5. Document External Dependencies
The DEPLOYMENT.md mentioned Stripe webhook setup but:
- Didn't emphasize it's REQUIRED for the app to work
- Didn't mention Test vs Live mode webhooks are separate
- Didn't include verification steps

---

## Changes Made to Prevent Recurrence

### 1. Added Results Endpoint Fallback
If session exists but has no jobs, run the search on-demand. This makes the app resilient to webhook failures.

### 2. Updated DEPLOYMENT.md
- Emphasized webhook is CRITICAL
- Added Test vs Live mode section
- Added verification checklist

### 3. Updated CLAUDE.md
- Changed "Job Data: Serper API" to "Job Data: Google Custom Search API"
- Added troubleshooting notes

### 4. Enhanced Logging
- Webhook logs clearly when events are received
- Results endpoint logs when fallback search runs

---

## Recommendations for Future Debugging

1. **Start with the simplest explanation** - Is it configured correctly?
2. **Check Vercel logs for actual errors** - Not just test output
3. **Verify Stripe webhook deliveries** - Dashboard shows success/failure
4. **Test the full user flow** - Not just API endpoints
5. **When in doubt, check configuration before code**

---

## Time Breakdown

| Activity | Time Spent | Value |
|----------|-----------|-------|
| Investigating search API | 1 hour | Low - wasn't the issue |
| Writing test scripts | 30 min | Medium - confirmed search worked |
| Adding fallback logic | 30 min | Medium - good safety net |
| Checking Stripe config | 15 min | High - found root cause |
| Fixing Stripe keys | 15 min | High - resolved issue |
| Adding results fallback | 15 min | High - final fix |

**Lesson:** We should have spent the first 15 minutes on Stripe configuration instead of the last.

---

*Written: December 29, 2025*
