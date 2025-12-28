# JobMatch Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository (already set up)
- All API keys ready (Stripe, Anthropic, Adzuna, Resend)
- Domain (optional, for custom email sender)

---

## Environment Variables

You'll need to set these environment variables in Vercel:

### Required for Production

```bash
# Stripe (PRODUCTION KEYS - replace with live keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Adzuna Job Search API
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...

# Resend Email API
RESEND_API_KEY=re_...

# App URL (will be your Vercel URL or custom domain)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Deployment Steps

### 1. Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository: `Leonwenhao/Jobmatch`
3. Vercel will auto-detect Next.js

### 2. Configure Environment Variables

1. In Vercel project settings → Environment Variables
2. Add all variables from the list above
3. Make sure to use **production** API keys for Stripe (sk_live_, pk_live_)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., `https://jobmatch.vercel.app`)

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### 4. Set Up Stripe Webhook

**Important:** You must configure the Stripe webhook for payments to work.

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
5. Copy the webhook signing secret (`whsec_...`)
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
7. Redeploy the app for changes to take effect

### 5. Configure Resend Domain (Optional but Recommended)

For production, you should verify a domain in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `jobmatch.com`)
3. Add DNS records (MX, TXT, CNAME) to your domain provider
4. Wait for verification (~5-10 minutes)
5. Update email sender in code:
   - File: `lib/resend.ts`
   - Change: `from: 'JobMatch <onboarding@resend.dev>'`
   - To: `from: 'JobMatch <jobs@yourdomain.com>'`
6. Commit and push changes

---

## Post-Deployment Checklist

- [ ] App loads successfully at production URL
- [ ] Upload resume flow works
- [ ] Stripe payment redirect works
- [ ] Webhook receives payment events (check Stripe dashboard → Events)
- [ ] Jobs are displayed on results page
- [ ] Email delivery works (check Resend dashboard → Logs)
- [ ] Mobile view is responsive
- [ ] All error states display correctly
- [ ] Test with a real resume and $5 payment

---

## Monitoring & Logs

### Vercel Logs
- View deployment logs: Vercel Dashboard → Your Project → Deployments
- View function logs: Vercel Dashboard → Your Project → Functions → Select function

### Stripe Events
- Monitor webhooks: Stripe Dashboard → Developers → Webhooks → Select endpoint
- View all events: Stripe Dashboard → Events

### Resend Email Logs
- View sent emails: Resend Dashboard → Logs
- Check delivery status and opens

---

## Troubleshooting

### Payment not processing
- Check Stripe webhook is configured correctly
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check Vercel function logs for errors

### Email not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery errors
- If using custom domain, ensure DNS records are verified

### Resume parsing fails
- Check `ANTHROPIC_API_KEY` is valid and has credits
- View Vercel function logs for Claude API errors

### No jobs found
- Verify `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are correct
- Check Adzuna API limits (250 requests/day on free tier)

---

## Custom Domain Setup (Optional)

1. Purchase domain from registrar (Namecheap, GoDaddy, etc.)
2. In Vercel: Settings → Domains → Add Domain
3. Follow Vercel instructions to configure DNS
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Stripe webhook URL to use custom domain

---

## Switching from Test to Production

### Stripe
1. Get production keys from Stripe Dashboard (toggle off "Test mode")
2. Update environment variables in Vercel
3. Create new webhook endpoint with production keys
4. Update `STRIPE_WEBHOOK_SECRET`

### Testing in Production
- Use Stripe test cards in test mode
- Create a test email for receiving job results
- Monitor all logs during first real transaction

---

## Cost Estimates (Monthly)

| Service | Free Tier | Cost After Free Tier |
|---------|-----------|----------------------|
| Vercel | 100GB bandwidth, 100 serverless executions | $20/month Pro |
| Stripe | Unlimited transactions | 2.9% + 30¢ per transaction |
| Anthropic Claude | $5 free credit | ~$0.003 per resume parse |
| Adzuna | 250 requests/day | Contact for paid plans |
| Resend | 100 emails/day | $20/month for 50k emails |

**Expected costs for 100 users/month:** ~$35-50

---

## Support & Maintenance

- Monitor Vercel analytics for usage patterns
- Check error logs weekly
- Keep dependencies updated (`npm outdated`)
- Review and respond to support emails promptly

---

*Last Updated: 2025-12-28*
