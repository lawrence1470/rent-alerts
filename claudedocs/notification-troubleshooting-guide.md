# Notification Troubleshooting Guide

## Quick Diagnosis

### Test Your Configuration
Visit this endpoint to check your notification setup:
```
GET https://yourdomain.com/api/test-notifications
```

Or send a test email:
```
POST https://yourdomain.com/api/test-notifications
```

## Common Issues & Solutions

### Issue 1: Not Receiving Email Notifications

**Symptoms:**
- Cron job runs successfully
- Alerts are active
- But no emails arrive

**Root Causes & Fixes:**

#### 1.1 Missing Resend API Key
```bash
# Check if configured
echo $RESEND_API_KEY

# Fix: Add to Vercel environment variables
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Get your key from: https://resend.com/api-keys

#### 1.2 Email Not Enabled on Alert
Check your alert settings:
- Go to Alert → Edit
- Ensure "Email notifications" toggle is ON
- Save changes

#### 1.3 User Email Not in Database
Your email must be in the local `users` table, not just Clerk.

**Check:**
```sql
SELECT id, email FROM users WHERE id = 'your-user-id';
```

**Fix:** Ensure Clerk webhook is syncing users properly.

#### 1.4 Resend Domain Not Verified
If using custom domain for emails:
- Go to Resend → Domains
- Verify your domain
- Update `RESEND_FROM_EMAIL` to use verified domain

### Issue 2: Cron Job Not Running

**Symptoms:**
- No cron executions in logs
- Alerts never checked

**Root Causes & Fixes:**

#### 2.1 GitHub Actions - Missing CRON_SECRET
**Check:**
- Go to GitHub → Settings → Secrets and variables → Actions
- Look for `CRON_SECRET`

**Fix:**
```bash
# Generate a random secret
openssl rand -base64 32

# Add to:
# 1. GitHub Secrets: CRON_SECRET
# 2. Vercel Environment Variables: CRON_SECRET
```

#### 2.2 GitHub Actions - Wrong Preview URL
The current preview URL `https://rent-alerts.vercel.app` returns 404.

**Fix Option 1 - Set Correct URL:**
- Go to GitHub → Settings → Variables → Actions
- Add variable: `PREVIEW_URL`
- Value: Your actual Vercel preview URL (e.g., `https://rent-notifcations-git-preview-yourname.vercel.app`)

**Fix Option 2 - Disable Preview Job:**
- Remove the `check-alerts-preview` job from `.github/workflows/cron-check-alerts.yml`
- Let Vercel Cron handle preview deployments via `vercel.json`

#### 2.3 Vercel Cron Not Configured
**Check:**
- Go to Vercel Dashboard → Your Project → Cron Jobs
- Verify cron jobs are listed and enabled

**Fix:**
Ensure `vercel.json` has:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0/15 * * * *"
    }
  ]
}
```

### Issue 3: 401 Unauthorized on Cron Endpoint

**Symptoms:**
- Cron endpoint returns 401
- Logs show "Unauthorized"

**Root Cause:**
Missing or mismatched `CRON_SECRET`

**Fix:**
```bash
# 1. Generate secret
CRON_SECRET=$(openssl rand -base64 32)

# 2. Add to GitHub Actions Secrets
# GitHub → Settings → Secrets → New secret
# Name: CRON_SECRET
# Value: [paste generated secret]

# 3. Add to Vercel Environment Variables
# Vercel → Project → Settings → Environment Variables
# Name: CRON_SECRET
# Value: [paste same secret]
# Environments: Production, Preview, Development
```

### Issue 4: Cron Runs But No Listings Found

**Symptoms:**
- Cron job succeeds
- Logs show "0 new listings found"
- But StreetEasy has listings

**Root Causes:**

#### 4.1 Alert Criteria Too Restrictive
- Check your alert filters (price, bedrooms, neighborhoods)
- Try broadening criteria temporarily to test

#### 4.2 StreetEasy API Rate Limiting
- Check API response in logs
- Verify `RAPIDAPI_KEY` is valid
- Check RapidAPI dashboard for quota

#### 4.3 Deduplication Working Too Well
All listings marked as "seen" already.

**Fix:**
```sql
-- Check seen listings count
SELECT COUNT(*) FROM user_seen_listings WHERE user_id = 'your-user-id';

-- Clear seen listings for testing (CAREFUL!)
DELETE FROM user_seen_listings WHERE user_id = 'your-user-id';
```

## Configuration Checklist

### Required Environment Variables

#### Production (Vercel)
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@yourdomain.com  # Optional

# Cron Security
CRON_SECRET=your-random-secret

# StreetEasy API
RAPIDAPI_KEY=your-rapidapi-key

# SMS (Optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### GitHub Actions Secrets
```bash
CRON_SECRET=same-as-vercel
```

#### GitHub Actions Variables (Optional)
```bash
PREVIEW_URL=https://your-preview-deployment.vercel.app
```

## Testing Workflow

### 1. Check Configuration
```bash
# Hit diagnostic endpoint
curl https://yourdomain.com/api/test-notifications \
  -H "Authorization: Bearer your-clerk-token"
```

### 2. Send Test Email
```bash
curl -X POST https://yourdomain.com/api/test-notifications \
  -H "Authorization: Bearer your-clerk-token"
```

### 3. Manually Trigger Cron
**Option A - GitHub Actions:**
- Go to Actions → Check Alerts Cron Job → Run workflow

**Option B - Direct API Call:**
```bash
curl https://yourdomain.com/api/cron/check-alerts \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 4. Check Logs
**Vercel:**
```bash
vercel logs --follow
```

**GitHub Actions:**
- Go to Actions tab → Latest workflow run

### 5. Verify Database
```sql
-- Check recent notifications
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- Check alert runs
SELECT * FROM alert_runs
ORDER BY executed_at DESC
LIMIT 10;
```

## Expected Behavior

### Successful Email Flow
1. Cron runs every 15 minutes
2. Fetches listings from StreetEasy
3. Filters by alert criteria
4. Checks for new (unseen) listings
5. Creates notification records in database
6. Processes pending email notifications
7. Sends via Resend
8. Marks notifications as "sent"

### Logs You Should See
```
Starting cron job: check-alerts
Processing 3 alert batches
Batch abc123: Found 45 listings
Alert "Manhattan 2BR": 5 new listings
Creating notifications for channels: email, in_app
Processing pending email notifications...
Email notifications: 5 sent, 0 failed
Cron job completed: { alertsProcessed: 3, emailSent: 5 }
```

## Still Having Issues?

### Debug Mode
Add console logs to track flow:

```typescript
// In cron-job.service.ts
console.log('🔍 Debug - Alert:', {
  name: alert.name,
  userId: alert.userId,
  enableEmail: alert.enableEmailNotifications,
  isActive: alert.isActive,
});
```

### Check Notification Queue
```sql
-- See pending notifications
SELECT n.*, l.address, a.name as alert_name
FROM notifications n
JOIN listings l ON l.id = n.listing_id
JOIN alerts a ON a.id = n.alert_id
WHERE n.status = 'pending'
ORDER BY n.created_at DESC;
```

### Verify User Record
```sql
-- Ensure user has email
SELECT id, email, phone_number, created_at
FROM users
WHERE id = 'your-user-id';
```

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| No emails | Add `RESEND_API_KEY` to Vercel |
| 401 on cron | Add matching `CRON_SECRET` to Vercel + GitHub |
| 404 on preview | Set `PREVIEW_URL` variable in GitHub or disable job |
| No listings | Broaden alert criteria or check API key |
| User email missing | Check Clerk webhook sync |

## Support Resources

- Resend Docs: https://resend.com/docs
- Vercel Cron Docs: https://vercel.com/docs/cron-jobs
- GitHub Actions Docs: https://docs.github.com/en/actions
- Clerk Webhooks: https://clerk.com/docs/webhooks
