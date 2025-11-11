# Setup Guide - Rental Notification System

## Prerequisites

- Node.js 18+ installed
- Neon Postgres account ([neon.tech](https://neon.tech))
- RapidAPI account with StreetEasy API access
- Clerk account ([clerk.com](https://clerk.com))
- Vercel account (for deployment)

## Step 1: Install Dependencies

All required dependencies are already in `package.json`. Verify with:

```bash
npm install
```

**Key Dependencies**:
- `drizzle-orm` - Type-safe ORM
- `@neondatabase/serverless` - Neon Postgres client
- `@clerk/nextjs` - Authentication
- `next` - Framework

**Add Drizzle Kit** (for migrations):
```bash
npm install -D drizzle-kit
```

## Step 2: Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in environment variables:

### Database (Neon Postgres)
1. Create a Neon project at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string
3. Add to `.env.local`:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### StreetEasy API (RapidAPI)
1. Sign up at [rapidapi.com](https://rapidapi.com)
2. Subscribe to StreetEasy Rentals API
3. Copy your API key
4. Add to `.env.local`:
```env
RAPIDAPI_KEY=your_key_here
```

### Cron Job Security
Generate a random secret for cron job authentication:
```bash
# macOS/Linux
openssl rand -base64 32

# Or use any random string generator
```

Add to `.env.local`:
```env
CRON_SECRET=your_random_secret_here
```

### Clerk Authentication
1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy your publishable and secret keys
3. Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Step 3: Database Migrations

1. Generate the migration:
```bash
npx drizzle-kit generate
```

2. Push schema to database:
```bash
npx drizzle-kit push
```

**Or manually run the migration**:
```bash
npx drizzle-kit migrate
```

**Verify database tables**:
```sql
-- Run in Neon SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see:
- alerts
- alert_batches
- alert_batch_memberships
- listings
- user_seen_listings
- notifications
- cron_job_logs

## Step 4: Local Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing the API

**Create an alert**:
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "name": "East Village 2BR",
    "areas": "east-village",
    "minPrice": 2000,
    "maxPrice": 3000,
    "minBeds": 2,
    "maxBeds": 2,
    "noFee": false
  }'
```

**Test cron job** (local only, requires CRON_SECRET):
```bash
curl http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Step 5: Vercel Deployment

### Initial Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts to link to your Vercel project

### Environment Variables

Add all environment variables to Vercel:

```bash
# Using Vercel CLI
vercel env add DATABASE_URL
vercel env add RAPIDAPI_KEY
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
```

**Or via Vercel Dashboard**:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add each variable for Production, Preview, and Development

### Cron Job Configuration

The `vercel.json` file is already configured:

```json
{
  "crons": [{
    "path": "/api/cron/check-alerts",
    "schedule": "0/15 * * * *"
  }]
}
```

**Cron Schedule**: Every 15 minutes
**Authentication**: Uses `CRON_SECRET` environment variable

### Verify Deployment

1. Check deployment status:
```bash
vercel ls
```

2. View logs:
```bash
vercel logs
```

3. Test production endpoint:
```bash
curl https://your-app.vercel.app/api/alerts \
  -H "Authorization: Bearer <clerk_token>"
```

## Step 6: Monitoring

### Cron Job Monitoring

Query cron job logs in Neon SQL Editor:

```sql
-- Recent executions
SELECT
  job_name,
  status,
  duration,
  alerts_processed,
  new_listings_found,
  notifications_created,
  started_at,
  error_message
FROM cron_job_logs
ORDER BY started_at DESC
LIMIT 20;

-- Success rate
SELECT
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate_percent
FROM cron_job_logs;
```

### Application Monitoring

**Vercel Dashboard**:
- View function execution logs
- Monitor performance metrics
- Track error rates

**Database Monitoring** (Neon):
- Query performance
- Connection pooling stats
- Database size

## Troubleshooting

### Database Connection Issues

**Error**: "Connection refused"
**Solution**: Verify `DATABASE_URL` includes `?sslmode=require`

**Error**: "Too many connections"
**Solution**: Neon serverless handles pooling automatically, but verify no long-running connections

### API Issues

**Error**: "StreetEasy API error: 401"
**Solution**: Verify `RAPIDAPI_KEY` is correct

**Error**: "Cron job unauthorized"
**Solution**: Verify `CRON_SECRET` matches in request header

### Clerk Authentication

**Error**: "Clerk not configured"
**Solution**: Verify all Clerk environment variables are set

**Error**: "Invalid publishable key"
**Solution**: Use keys for correct environment (development vs production)

## Development Workflow

### Making Schema Changes

1. Update `lib/schema.ts`
2. Generate migration:
```bash
npx drizzle-kit generate
```
3. Review migration in `drizzle/` folder
4. Apply migration:
```bash
npx drizzle-kit push
```

### Testing Changes

1. Create test alerts in development
2. Manually trigger cron job:
```bash
curl http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
3. Check logs and database

### Deployment Process

1. Commit changes:
```bash
git add .
git commit -m "Add new feature"
```

2. Push to GitHub:
```bash
git push origin main
```

3. Vercel auto-deploys from main branch

## Performance Optimization

### Database Indexes

All critical indexes are defined in schema. Verify with:

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Query Optimization

Use Neon's query insights to identify slow queries:
1. Go to Neon dashboard
2. Navigate to Monitoring
3. Review slow queries

### Cron Job Optimization

Monitor execution time in `cron_job_logs`:

```sql
SELECT
  AVG(duration) as avg_duration_ms,
  MAX(duration) as max_duration_ms,
  MIN(duration) as min_duration_ms
FROM cron_job_logs
WHERE status = 'completed'
AND started_at > NOW() - INTERVAL '7 days';
```

Target: <3 minutes for 1000 alerts

## Next Steps

1. **Test the system**:
   - Create multiple alerts
   - Run cron job manually
   - Verify notifications created

2. **Configure notifications**:
   - Implement email sending (Resend, SendGrid)
   - Add notification preferences
   - Test notification delivery

3. **Build UI**:
   - Alert management interface
   - Notification feed
   - Dashboard with stats

4. **Monitor & Optimize**:
   - Track batch efficiency
   - Monitor API costs
   - Optimize query performance

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Neon Postgres Docs](https://neon.tech/docs/introduction)
- [Clerk Documentation](https://clerk.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [StreetEasy API](https://rapidapi.com/streeteasy/api/streeteasy-rentals)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review logs in Vercel dashboard
3. Check database logs in Neon
4. Review `claudedocs/database-architecture.md` for detailed architecture
