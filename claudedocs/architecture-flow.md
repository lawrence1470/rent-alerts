# Architecture Flow Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Create Alert → POST /api/alerts                                │
│       ↓                                                           │
│  Validate & Save → alerts table                                 │
│       ↓                                                           │
│  Rebuild Batches → Smart grouping algorithm                     │
│       ↓                                                           │
│  Wait for Cron → Vercel Cron (every 15 min)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED PROCESSING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Cron Trigger → GET /api/cron/check-alerts                     │
│       ↓                                                           │
│  Load Batches → alert_batches table                            │
│       ↓                                                           │
│  Fetch Listings → StreetEasy API (batched calls)               │
│       ↓                                                           │
│  Upsert Listings → listings table                              │
│       ↓                                                           │
│  Filter Matches → Local filtering per alert                    │
│       ↓                                                           │
│  Check Seen → user_seen_listings table                         │
│       ↓                                                           │
│  Create Notifications → notifications table                    │
│       ↓                                                           │
│  Mark as Seen → user_seen_listings table                       │
│       ↓                                                           │
│  Log Metrics → cron_job_logs table                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     USER NOTIFICATIONS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Checks → GET /api/notifications                          │
│       ↓                                                           │
│  Display Feed → In-app notification UI                         │
│       ↓                                                           │
│  Mark Read → PATCH /api/notifications                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Alert Batching Flow (Cost Optimization)

```
┌───────────────────────────────────────────────────────────────┐
│ PROBLEM: 100 users, 100 API calls, HIGH COST                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│ SOLUTION: Smart Batching Algorithm                            │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Group by Areas                                       │
│  ┌─────────────────────────────────────────────────┐         │
│  │ "east-village" → [Alert1, Alert2, Alert3, ...]  │         │
│  │ "west-village" → [Alert4, Alert5, ...]          │         │
│  │ "chelsea" → [Alert6, Alert7, ...]               │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Step 2: Calculate Broadest Criteria Per Group               │
│  ┌─────────────────────────────────────────────────┐         │
│  │ East Village Group:                              │         │
│  │   Alert1: $2K-3K, 2BR                           │         │
│  │   Alert2: $2.5K-3.5K, 2BR                       │         │
│  │   Alert3: $2K-4K, 1-2BR                         │         │
│  │   ──────────────────────────────────────        │         │
│  │   Batch: $2K-4K, 1-2BR (covers all)            │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Step 3: Make ONE API Call Per Batch                         │
│  ┌─────────────────────────────────────────────────┐         │
│  │ API Call: east-village, $2K-4K, 1-2BR           │         │
│  │ Returns: 50 listings                             │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Step 4: Filter Locally for Each Alert                       │
│  ┌─────────────────────────────────────────────────┐         │
│  │ Alert1 ($2K-3K, 2BR) → 8 matches               │         │
│  │ Alert2 ($2.5K-3.5K, 2BR) → 5 matches           │         │
│  │ Alert3 ($2K-4K, 1-2BR) → 15 matches            │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│ RESULT: 100 users, 5-10 API calls, 90-95% COST REDUCTION     │
└───────────────────────────────────────────────────────────────┘
```

## Deduplication Flow

```
┌───────────────────────────────────────────────────────────────┐
│ NEW LISTINGS FOUND                                             │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Listing A: 2BR East Village, $2,800                         │
│  Listing B: 1BR West Village, $2,500                         │
│  Listing C: 2BR Chelsea, $3,200                              │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│ FOR EACH ALERT                                                 │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alert: East Village 2BR Alert                               │
│       ↓                                                         │
│  Check: user_seen_listings table                             │
│  ┌─────────────────────────────────────────────────┐         │
│  │ User has seen: [Listing A, Listing D]           │         │
│  └─────────────────────────────────────────────────┘         │
│       ↓                                                         │
│  Filter: Remove Listing A (already seen)                     │
│       ↓                                                         │
│  Result: Listing B, Listing C are NEW                        │
│       ↓                                                         │
│  Create: 2 notifications                                      │
│       ↓                                                         │
│  Mark Seen: Add Listing B & C to user_seen_listings         │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│ RESULT: User only notified about NEW listings                 │
└───────────────────────────────────────────────────────────────┘
```

## Database Entity Relationships

```
┌──────────────┐         ┌────────────────────┐
│    users     │         │      alerts        │
│  (Clerk)     │         │                    │
│              │────────>│ id                 │
│ userId       │         │ userId (FK)        │
└──────────────┘         │ name               │
                          │ areas              │
                          │ minPrice/maxPrice  │
                          │ minBeds/maxBeds    │
                          │ isActive           │
                          │ lastChecked        │
                          └────────────────────┘
                                    │
                                    │ (many-to-many)
                                    │
                          ┌─────────▼──────────┐
                          │ alert_batch_       │
                          │  memberships       │
                          │                    │
                          │ alertId (FK)       │
                          │ batchId (FK)       │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  alert_batches     │
                          │                    │
                          │ id                 │
                          │ areas              │
                          │ minPrice/maxPrice  │
                          │ criteriaHash       │
                          │ alertCount         │
                          │ lastFetched        │
                          └────────────────────┘

┌──────────────┐         ┌────────────────────┐
│   listings   │         │  user_seen_        │
│              │         │   listings         │
│ id           │<────────┤                    │
│ streetEasyId │         │ userId             │
│ title        │         │ listingId (FK)     │
│ address      │         │ alertId (FK)       │
│ price        │         │ firstSeenAt        │
│ bedrooms     │         └────────────────────┘
│ bathrooms    │
│ neighborhood │         ┌────────────────────┐
│ listingUrl   │         │  notifications     │
│ firstSeenAt  │<────────┤                    │
└──────────────┘         │ userId             │
                          │ alertId (FK)       │
                          │ listingId (FK)     │
                          │ channel            │
                          │ status             │
                          │ subject/body       │
                          │ createdAt          │
                          └────────────────────┘
```

## Cron Job Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ VERCEL CRON TRIGGER (Every 15 minutes)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Initialize                                           │
├─────────────────────────────────────────────────────────────┤
│ • Verify CRON_SECRET authentication                         │
│ • Create cron_job_logs entry (status: started)             │
│ • Start performance timer                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Load Batches                                        │
├─────────────────────────────────────────────────────────────┤
│ • Query alert_batches table                                 │
│ • Join with alerts (filter isActive = true)                │
│ • Result: 10-50 batches with their alert IDs               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Process Each Batch (Parallel where possible)       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FOR EACH BATCH:                                            │
│    ┌──────────────────────────────────────────────┐        │
│    │ A. Fetch from StreetEasy API                 │        │
│    │    - Use batch criteria (broadest params)    │        │
│    │    - Get up to 100 listings                  │        │
│    │    - Handle rate limits & errors             │        │
│    └──────────────────────────────────────────────┘        │
│                 ↓                                            │
│    ┌──────────────────────────────────────────────┐        │
│    │ B. Upsert Listings                           │        │
│    │    - Check if listing exists (streetEasyId)  │        │
│    │    - Update if exists, insert if new         │        │
│    │    - Update lastSeenAt timestamp             │        │
│    └──────────────────────────────────────────────┘        │
│                 ↓                                            │
│    ┌──────────────────────────────────────────────┐        │
│    │ C. Process Each Alert in Batch              │        │
│    │                                               │        │
│    │  FOR EACH ALERT:                             │        │
│    │    1. Filter listings (match criteria)       │        │
│    │    2. Get user's seen listings               │        │
│    │    3. Remove already-seen                    │        │
│    │    4. Create notifications                   │        │
│    │    5. Mark listings as seen                  │        │
│    │    6. Update alert.lastChecked               │        │
│    └──────────────────────────────────────────────┘        │
│                 ↓                                            │
│    ┌──────────────────────────────────────────────┐        │
│    │ D. Update Batch Metadata                     │        │
│    │    - Set lastFetched timestamp               │        │
│    └──────────────────────────────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Finalize                                            │
├─────────────────────────────────────────────────────────────┤
│ • Calculate metrics (duration, counts)                      │
│ • Update cron_job_logs (status: completed)                 │
│ • Return success response                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULT: New notifications ready for users                   │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization Flow

```
┌───────────────────────────────────────────────────────────────┐
│ QUERY OPTIMIZATION                                             │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Without Indexes:                                             │
│  ┌─────────────────────────────────────────────────┐         │
│  │ Full table scan → 500ms for 1000 alerts        │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  With Composite Index:                                        │
│  ┌─────────────────────────────────────────────────┐         │
│  │ INDEX(isActive, areas, minPrice, maxPrice)      │         │
│  │ Index scan → 10ms for 1000 alerts              │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Result: 50x faster queries                                   │
│                                                                 │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ CONNECTION POOLING                                             │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Traditional PostgreSQL:                                      │
│  ┌─────────────────────────────────────────────────┐         │
│  │ WebSocket connection → 100-500ms cold start     │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Neon Serverless HTTP:                                        │
│  ┌─────────────────────────────────────────────────┐         │
│  │ HTTP connection → 10-50ms cold start            │         │
│  │ No connection pooling needed                     │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Result: 5-10x faster cold starts                            │
│                                                                 │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ BATCH PROCESSING                                               │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sequential Processing:                                       │
│  ┌─────────────────────────────────────────────────┐         │
│  │ Batch 1 → Batch 2 → Batch 3 → ... → 180s       │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Parallel Processing (where safe):                           │
│  ┌─────────────────────────────────────────────────┐         │
│  │ Batch 1 ┐                                        │         │
│  │ Batch 2 ├─> Process together → 60s              │         │
│  │ Batch 3 ┘                                        │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                 │
│  Result: 3x faster execution                                  │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

## Scalability Projection

```
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM CAPACITY                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  100 Alerts:                                                │
│  • Batches: 1-2                                            │
│  • API Calls: 1-2                                          │
│  • Duration: <30 seconds                                   │
│  • Cost: Minimal                                           │
│                                                              │
│  1,000 Alerts:                                             │
│  • Batches: 10-50                                          │
│  • API Calls: 10-50                                        │
│  • Duration: <3 minutes                                    │
│  • Cost: Low                                               │
│                                                              │
│  10,000 Alerts:                                            │
│  • Batches: 100-500                                        │
│  • API Calls: 100-500                                      │
│  • Duration: <15 minutes (may need optimization)          │
│  • Cost: Moderate                                          │
│                                                              │
│  Optimization Path for 10K+:                               │
│  1. Multiple cron jobs (parallel regions)                 │
│  2. Smarter batching (ML-based grouping)                  │
│  3. Incremental processing (delta updates)                │
│  4. Caching layer (Redis)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ ERROR SCENARIOS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Call Failure:                                         │
│  ┌────────────────────────────────────────────┐           │
│  │ StreetEasy API Error                       │           │
│  │    ↓                                        │           │
│  │ Log error to cron_job_logs                 │           │
│  │    ↓                                        │           │
│  │ Skip this batch, continue with next       │           │
│  │    ↓                                        │           │
│  │ Mark batch as failed (don't update time)  │           │
│  │    ↓                                        │           │
│  │ Retry on next cron run (15 min later)     │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
│  Database Error:                                           │
│  ┌────────────────────────────────────────────┐           │
│  │ Query Timeout / Connection Error           │           │
│  │    ↓                                        │           │
│  │ Log full stack trace                       │           │
│  │    ↓                                        │           │
│  │ Mark entire job as failed                  │           │
│  │    ↓                                        │           │
│  │ Return 500 error to Vercel                │           │
│  │    ↓                                        │           │
│  │ Vercel retries (with exponential backoff) │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
│  Notification Creation Error:                              │
│  ┌────────────────────────────────────────────┐           │
│  │ Invalid data / constraint violation        │           │
│  │    ↓                                        │           │
│  │ Log specific notification error            │           │
│  │    ↓                                        │           │
│  │ Skip this notification, continue           │           │
│  │    ↓                                        │           │
│  │ Don't mark listing as seen (retry later)  │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│ CRON JOB HEALTH DASHBOARD                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Last 24 Hours:                                             │
│  ┌────────────────────────────────────────────┐           │
│  │ Total Runs: 96 (every 15 min)              │           │
│  │ Successful: 94                              │           │
│  │ Failed: 2                                   │           │
│  │ Success Rate: 97.9%                         │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
│  Performance Metrics:                                       │
│  ┌────────────────────────────────────────────┐           │
│  │ Average Duration: 1m 45s                    │           │
│  │ Max Duration: 3m 12s                        │           │
│  │ Min Duration: 45s                           │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
│  Processing Stats:                                          │
│  ┌────────────────────────────────────────────┐           │
│  │ Alerts Processed: 14,400 (150 per run)     │           │
│  │ Batches Fetched: 1,152 (12 per run)        │           │
│  │ New Listings Found: 768 (8 per run)        │           │
│  │ Notifications Created: 2,304 (24 per run)  │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
│  Cost Efficiency:                                           │
│  ┌────────────────────────────────────────────┐           │
│  │ Without Batching: 14,400 API calls         │           │
│  │ With Batching: 1,152 API calls             │           │
│  │ Savings: 92% reduction                      │           │
│  └────────────────────────────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
