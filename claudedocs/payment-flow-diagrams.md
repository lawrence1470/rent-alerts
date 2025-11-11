# Payment System Flow Diagrams

Visual representations of critical flows in the week-based payment system.

---

## 1. Complete Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER PURCHASE FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

    USER                    FRONTEND              BACKEND              STRIPE
     │                         │                     │                    │
     │  Click "Buy 3 weeks    │                     │                    │
     │  @ $20/week"           │                     │                    │
     ├────────────────────────>│                     │                    │
     │                         │                     │                    │
     │                         │  POST /api/checkout/│                    │
     │                         │  create-session     │                    │
     │                         │  {tierId, weekQty:3}│                    │
     │                         ├────────────────────>│                    │
     │                         │                     │                    │
     │                         │                     │  stripe.checkout   │
     │                         │                     │  .sessions.create()│
     │                         │                     ├───────────────────>│
     │                         │                     │                    │
     │                         │                     │  {sessionId, url}  │
     │                         │                     │<───────────────────┤
     │                         │  {sessionId, url}   │                    │
     │                         │<────────────────────┤                    │
     │                         │                     │                    │
     │  Redirect to Stripe    │                     │                    │
     │<────────────────────────┤                     │                    │
     │                         │                     │                    │
     ├─────────────────────────┼─────────────────────┼───────────────────>│
     │                         │                     │                    │
     │  [User completes payment on Stripe hosted page]                    │
     │                         │                     │                    │
     │                         │                     │  Webhook: checkout │
     │                         │                     │  .session.completed│
     │                         │                     │<───────────────────┤
     │                         │                     │                    │
     │                         │                  ┌──┴──────────────────┐ │
     │                         │                  │ Create purchase     │ │
     │                         │                  │ record (pending)    │ │
     │                         │                  └──┬──────────────────┘ │
     │                         │                     │                    │
     │                         │                     │  Webhook: payment  │
     │                         │                     │  _intent.succeeded │
     │                         │                     │<───────────────────┤
     │                         │                     │                    │
     │                         │               ┌─────▼──────────────────┐ │
     │                         │               │ TRANSACTION BEGINS     │ │
     │                         │               │                        │ │
     │                         │               │ 1. Get current access  │ │
     │                         │               │ 2. Calculate dates:    │ │
     │                         │               │    - If active: extend │ │
     │                         │               │    - If none: start now│ │
     │                         │               │ 3. Create access_period│ │
     │                         │               │ 4. Update purchase     │ │
     │                         │               │                        │ │
     │                         │               │ TRANSACTION COMMIT     │ │
     │                         │               └─────┬──────────────────┘ │
     │                         │                     │                    │
     │  Redirect to           │                     │                    │
     │  success page          │                     │                    │
     │<────────────────────────┼─────────────────────┤                    │
     │                         │                     │                    │
     │  Dashboard shows       │                     │  Send confirmation  │
     │  "Access until Dec 1"  │                     │  email (async)      │
     │<────────────────────────┼─────────────────────┤                    │
     │                         │                     │                    │
```

---

## 2. Access Validation Flow (Cron Job)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CRON JOB EXECUTION (Every 15 min)                   │
└─────────────────────────────────────────────────────────────────────────┘

  VERCEL CRON           CRON SERVICE                 DATABASE
       │                      │                           │
       │  Trigger             │                           │
       │  /api/cron/check     │                           │
       │  -alerts             │                           │
       ├─────────────────────>│                           │
       │                      │                           │
       │                      │  1. Get all active alerts │
       │                      ├──────────────────────────>│
       │                      │                           │
       │                      │  [10,000 alerts returned] │
       │                      │<──────────────────────────┤
       │                      │                           │
       │                   ┌──▼────────────────────────┐  │
       │                   │ Extract unique user IDs   │  │
       │                   │ [5,000 unique users]      │  │
       │                   └──┬────────────────────────┘  │
       │                      │                           │
       │                      │  2. BATCH: Get access     │
       │                      │  intervals for all users  │
       │                      ├──────────────────────────>│
       │                      │                           │
       │                      │  Query:                   │
       │                      │  SELECT userId,           │
       │                      │    checkIntervalMinutes   │
       │                      │  FROM user_access_periods │
       │                      │  JOIN payment_tiers       │
       │                      │  WHERE status='active'    │
       │                      │  AND expiresAt >= NOW()   │
       │                      │                           │
       │                      │  Result: Map<userId, int> │
       │                      │<──────────────────────────┤
       │                      │                           │
       │                   ┌──▼────────────────────────┐  │
       │                   │ Filter alerts:            │  │
       │                   │                           │  │
       │                   │ For each alert:           │  │
       │                   │   interval = map[userId]  │  │
       │                   │   if !interval:           │  │
       │                   │     interval = 60 (free)  │  │
       │                   │                           │  │
       │                   │   shouldCheck =           │  │
       │                   │     (now - lastCheck)     │  │
       │                   │     >= interval           │  │
       │                   │                           │  │
       │                   │ Results:                  │  │
       │                   │ - 15-min tier: 2K alerts  │  │
       │                   │ - 30-min tier: 1.5K alerts│  │
       │                   │ - Hourly tier: 3K alerts  │  │
       │                   │ - Total: 6.5K/10K checked │  │
       │                   └──┬────────────────────────┘  │
       │                      │                           │
       │                      │  3. Continue with         │
       │                      │  batching & API calls...  │
       │                      │                           │
       │                      │  4. Update lastChecked    │
       │                      │  for processed alerts     │
       │                      ├──────────────────────────>│
       │                      │                           │
       │  200 OK             │                           │
       │<─────────────────────┤                           │
       │                      │                           │
       │  Log: "Filtered 10K  │                           │
       │  alerts → 6.5K       │                           │
       │  checked (35% saved)"│                           │
       │                      │                           │

PERFORMANCE:
  ✅ Single batch query for all users: ~50ms
  ✅ Filter 10K alerts in memory: ~100ms
  ✅ Total filtering overhead: <200ms
  ✅ Cost savings: 35% fewer StreetEasy API calls
```

---

## 3. Access Period Calculation Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCESS PERIOD CALCULATION                             │
└─────────────────────────────────────────────────────────────────────────┘

SCENARIO 1: User has NO active access
─────────────────────────────────────

    NOW                                       FUTURE
     │                                          │
     │  Purchase: 3 weeks @ 15-min tier         │
     │                                          │
     ├──────────────┬──────────────┬────────────┤
     │              │              │            │
   Start        Week 1          Week 2       Expires
 (immediate)                                (NOW + 21 days)

Calculation:
  startsAt = NOW
  expiresAt = NOW + (weekQuantity * 7 days)
  expiresAt = NOW + (3 * 7) = NOW + 21 days


SCENARIO 2: User has ACTIVE access (extend)
────────────────────────────────────────────

    NOW           Current Expiry                FUTURE
     │                 │                          │
     │                 │  Purchase: 2 weeks       │
     │                 │  @ 30-min tier           │
     │                 │                          │
     ├─────────────────┼─────────────┬────────────┤
     │   (existing)    │             │            │
   (ignore)         Start         Week 1       Expires
                  (extend from               (Current expiry
                   current)                    + 14 days)

Calculation:
  existingExpiry = "2024-11-15T12:00:00Z"
  startsAt = existingExpiry
  expiresAt = existingExpiry + (weekQuantity * 7 days)
  expiresAt = "2024-11-15" + 14 days = "2024-11-29T12:00:00Z"


SCENARIO 3: User has MULTIPLE active periods (different tiers)
───────────────────────────────────────────────────────────────

    NOW                                           FUTURE
     │                                              │
     │  Existing:                                   │
     │  - Period A: Hourly, expires Dec 1           │
     │  - Period B: 30-min, expires Dec 15          │
     │                                               │
     │  Purchase: 15-min tier, 1 week               │
     │                                               │
     ├──────────────┬──────────┬─────────┬──────────┤
     │              │          │         │          │
   Period A      Period B    Period B   NEW      NEW
   Hourly        30-min      30-min   15-min   Expires
   (Dec 1)      starts       (Dec 15)  Start  (Dec 22)
                                     (Dec 15)

Calculation:
  // Find LATEST expiry among ALL active periods
  latestExpiry = MAX(periodA.expiresAt, periodB.expiresAt)
  latestExpiry = "2024-12-15T12:00:00Z"

  startsAt = latestExpiry
  expiresAt = latestExpiry + 7 days = "2024-12-22T12:00:00Z"

Cron Behavior:
  - Nov 8 - Dec 1: Uses 15-min (fastest of all active)
  - Dec 1 - Dec 15: Uses 15-min (Period A expired, 15-min/30-min remain)
  - Dec 15 - Dec 22: Uses 15-min only
  - After Dec 22: No access, reverts to hourly (free)


EDGE CASE: Purchase 6 weeks while 2 weeks remain
─────────────────────────────────────────────────

    NOW         Current Expiry                    FUTURE
     │               │                               │
     │  2 weeks left │  Purchase: 6 weeks            │
     │               │                               │
     ├───────────────┼───────────────────────────────┤
     │   (existing)  │        New 6 weeks            │
   (ignore)       Start                           Expires
                (Nov 22)                         (Jan 3)
                                               (Nov 22 + 42 days)

Calculation:
  existingExpiry = "2024-11-22T12:00:00Z"
  startsAt = existingExpiry
  expiresAt = existingExpiry + (6 * 7) days
  expiresAt = "2024-11-22" + 42 days = "2025-01-03T12:00:00Z"

Result: User gets FULL 8 weeks total (2 existing + 6 new)
```

---

## 4. Webhook Event Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       STRIPE WEBHOOK HANDLER                             │
└─────────────────────────────────────────────────────────────────────────┘

  STRIPE                    BACKEND                    DATABASE
    │                          │                           │
    │  POST /api/webhooks/    │                           │
    │  stripe                 │                           │
    │  Event: checkout.session│                           │
    │  .completed             │                           │
    ├────────────────────────>│                           │
    │                          │                           │
    │                       ┌──▼─────────────────────────┐ │
    │                       │ Verify signature          │ │
    │                       │ (HMAC with webhook secret)│ │
    │                       └──┬─────────────────────────┘ │
    │                          │                           │
    │                          │  Check for duplicate      │
    │                          │  event processing         │
    │                          ├──────────────────────────>│
    │                          │                           │
    │                          │  SELECT * FROM            │
    │                          │  stripe_webhook_events    │
    │                          │  WHERE stripeEventId=?    │
    │                          │                           │
    │                          │  [No match found]         │
    │                          │<──────────────────────────┤
    │                          │                           │
    │                          │  INSERT webhook event     │
    │                          │  (status: pending)        │
    │                          ├──────────────────────────>│
    │                          │                           │
    │                       ┌──▼─────────────────────────┐ │
    │                       │ Route by event type:      │ │
    │                       │                           │ │
    │                       │ - checkout.session        │ │
    │                       │   .completed →            │ │
    │                       │   handleCheckoutCompleted │ │
    │                       │                           │ │
    │                       │ - payment_intent          │ │
    │                       │   .succeeded →            │ │
    │                       │   handlePaymentSucceeded  │ │
    │                       │                           │ │
    │                       │ - charge.refunded →       │ │
    │                       │   handleRefund            │ │
    │                       └──┬─────────────────────────┘ │
    │                          │                           │
    │                          │  CREATE purchase record   │
    │                          ├──────────────────────────>│
    │                          │                           │
    │                          │  UPDATE webhook event     │
    │                          │  (status: processed)      │
    │                          ├──────────────────────────>│
    │                          │                           │
    │  200 OK                 │                           │
    │<────────────────────────┤                           │
    │                          │                           │
    │  Event: payment_intent  │                           │
    │  .succeeded             │                           │
    │  (5 seconds later)      │                           │
    ├────────────────────────>│                           │
    │                          │                           │
    │                       ┌──▼─────────────────────────┐ │
    │                       │ Find purchase by           │ │
    │                       │ paymentIntentId            │ │
    │                       └──┬─────────────────────────┘ │
    │                          │                           │
    │                          │  SELECT * FROM purchases  │
    │                          │  WHERE stripePaymentIntent│
    │                          │  Id = ?                   │
    │                          ├──────────────────────────>│
    │                          │                           │
    │                          │  [Purchase found]         │
    │                          │<──────────────────────────┤
    │                          │                           │
    │                       ┌──▼─────────────────────────┐ │
    │                       │ BEGIN TRANSACTION         │ │
    │                       │                           │ │
    │                       │ 1. Calculate access dates │ │
    │                       │ 2. Create access_period   │ │
    │                       │ 3. Update purchase        │ │
    │                       │                           │ │
    │                       │ COMMIT                    │ │
    │                       └──┬─────────────────────────┘ │
    │                          │                           │
    │                          │  3 INSERT/UPDATE queries  │
    │                          ├──────────────────────────>│
    │                          │                           │
    │                          │  [Success]                │
    │                          │<──────────────────────────┤
    │                          │                           │
    │                       ┌──▼─────────────────────────┐ │
    │                       │ Send confirmation email   │ │
    │                       │ (async, non-blocking)     │ │
    │                       └───────────────────────────┘ │
    │                          │                           │
    │  200 OK                 │                           │
    │<────────────────────────┤                           │
    │                          │                           │


ERROR HANDLING:
───────────────

  STRIPE              BACKEND              DATABASE
    │                    │                     │
    │  Event arrives    │                     │
    │  (3rd attempt)    │                     │
    ├──────────────────>│                     │
    │                    │                     │
    │                    │  Check duplicate    │
    │                    ├────────────────────>│
    │                    │                     │
    │                    │  Found: status =    │
    │                    │  'processed'        │
    │                    │<────────────────────┤
    │                    │                     │
    │  200 OK           │  Skip processing    │
    │  (idempotent)     │  Log: "Already      │
    │<──────────────────┤  processed"         │
    │                    │                     │

  OR

  STRIPE              BACKEND              DATABASE
    │                    │                     │
    │  Event arrives    │                     │
    ├──────────────────>│                     │
    │                    │                     │
    │                 ┌──▼──────────────────┐  │
    │                 │ Handler throws      │  │
    │                 │ exception           │  │
    │                 └──┬──────────────────┘  │
    │                    │                     │
    │                    │  UPDATE webhook     │
    │                    │  event:             │
    │                    │  status = 'failed'  │
    │                    │  errorMessage = ... │
    │                    │  processingAttempts │
    │                    │  = attempts + 1     │
    │                    ├────────────────────>│
    │                    │                     │
    │  500 Error        │                     │
    │<──────────────────┤                     │
    │                    │                     │
    │  [Stripe will     │                     │
    │   retry in 1 min] │                     │
    │                    │                     │
```

---

## 5. Expiry & Renewal Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXPIRY MANAGEMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

TIMELINE:

  Nov 1                    Nov 7                    Nov 8
    │                        │                        │
    │  User purchases 1 week │  24h reminder sent     │  Access expires
    │  @ 15-min tier         │                        │
    │                        │                        │
    ├────────────────────────┼────────────────────────┤
    │  Active: 15-min checks │  Active: 15-min checks │  Free: hourly checks
    │  expiresAt: Nov 8      │  expiresAt: Nov 8      │  expiresAt: null
    │                        │                        │


CRON JOBS:
──────────

┌─────────────────────────────────────────────────────────────────────┐
│ Job 1: Send Expiry Reminders (Daily @ 9am UTC)                      │
└─────────────────────────────────────────────────────────────────────┘

  VERCEL CRON         SERVICE                 DATABASE
       │                 │                        │
       │  Trigger        │                        │
       │  9:00 AM UTC    │                        │
       ├────────────────>│                        │
       │                 │                        │
       │                 │  Query: Find periods   │
       │                 │  expiring in 24-48h    │
       │                 ├───────────────────────>│
       │                 │                        │
       │                 │  SELECT * FROM         │
       │                 │  user_access_periods   │
       │                 │  WHERE status='active' │
       │                 │  AND expiresAt BETWEEN │
       │                 │    NOW() + 24h         │
       │                 │    AND NOW() + 48h     │
       │                 │                        │
       │                 │  [50 users found]      │
       │                 │<───────────────────────┤
       │                 │                        │
       │              ┌──▼─────────────────────┐  │
       │              │ For each user:         │  │
       │              │ - Load tier info       │  │
       │              │ - Calculate hours left │  │
       │              │ - Send email with:     │  │
       │              │   * Expiry time        │  │
       │              │   * Current tier       │  │
       │              │   * Renewal CTA        │  │
       │              └────────────────────────┘  │
       │                 │                        │
       │  200 OK         │                        │
       │<────────────────┤                        │
       │                 │                        │


┌─────────────────────────────────────────────────────────────────────┐
│ Job 2: Mark Expired Access (Hourly @ :00)                           │
└─────────────────────────────────────────────────────────────────────┘

  VERCEL CRON         SERVICE                 DATABASE
       │                 │                        │
       │  Trigger        │                        │
       │  10:00 AM UTC   │                        │
       ├────────────────>│                        │
       │                 │                        │
       │                 │  UPDATE                │
       │                 │  user_access_periods   │
       │                 │  SET status='expired'  │
       │                 │  WHERE status='active' │
       │                 │  AND expiresAt<=NOW()  │
       │                 ├───────────────────────>│
       │                 │                        │
       │                 │  [15 periods updated]  │
       │                 │<───────────────────────┤
       │                 │                        │
       │              ┌──▼─────────────────────┐  │
       │              │ For each expired user: │  │
       │              │ - Clear access cache   │  │
       │              │ - Send "Expired" email │  │
       │              │ - Prompt to renew      │  │
       │              └────────────────────────┘  │
       │                 │                        │
       │  200 OK         │                        │
       │<────────────────┤                        │
       │                 │                        │


USER EXPERIENCE:
────────────────

  Nov 7, 9:00 AM                  Nov 8, 10:00 AM
       │                                │
       │  Email: "Your access          │  Email: "Your access
       │  expires in 24 hours"          │  has expired"
       │                                │
       │  Dashboard banner:             │  Dashboard banner:
       │  ⚠️ Access expires tomorrow    │  ⚠️ Access expired
       │  [Renew Now]                   │  [Upgrade to continue
       │                                │   15-min checks]
       │                                │
       │  Cron behavior:                │  Cron behavior:
       │  ✅ 15-min checks              │  ⏰ Hourly checks (free)
       │                                │
```

---

## 6. Refund Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REFUND HANDLING                                  │
└─────────────────────────────────────────────────────────────────────────┘

SCENARIO: User bought 4 weeks on Nov 1, requests refund on Nov 8 (1 week used)

  Nov 1               Nov 8                              Nov 29
    │                   │                                   │
    │  Purchase: 4 weeks│  Refund issued                   │  (original expiry)
    │  @ $20/week = $80 │  Refund: 3 weeks = $60           │
    │                   │                                   │
    ├───────────────────┼───────────────────────────────────┤
    │   Week 1 (used)   │  Weeks 2-4 (refunded)             │
    │   $20 earned      │  Access revoked immediately       │


FLOW:

  ADMIN/STRIPE        BACKEND                DATABASE
       │                 │                       │
       │  Issue partial  │                       │
       │  refund via     │                       │
       │  Stripe         │                       │
       │  dashboard      │                       │
       │                 │                       │
       │  Webhook:       │                       │
       │  charge.refunded│                       │
       ├────────────────>│                       │
       │                 │                       │
       │              ┌──▼────────────────────┐  │
       │              │ Parse refund event:   │  │
       │              │ - paymentIntentId     │  │
       │              │ - refundAmount: 6000  │  │
       │              │ - reason: "requested" │  │
       │              └──┬────────────────────┘  │
       │                 │                       │
       │                 │  Find purchase by     │
       │                 │  paymentIntentId      │
       │                 ├──────────────────────>│
       │                 │                       │
       │                 │  [Purchase found]     │
       │                 │<──────────────────────┤
       │                 │                       │
       │              ┌──▼────────────────────┐  │
       │              │ BEGIN TRANSACTION     │  │
       │              │                       │  │
       │              │ 1. Update purchase:   │  │
       │              │    status='refunded'  │  │
       │              │    refundedAt=NOW()   │  │
       │              │    refundAmount=6000  │  │
       │              │                       │  │
       │              │ 2. Cancel access:     │  │
       │              │    UPDATE access      │  │
       │              │    SET status=        │  │
       │              │    'cancelled'        │  │
       │              │                       │  │
       │              │ COMMIT                │  │
       │              └──┬────────────────────┘  │
       │                 │                       │
       │                 │  2 UPDATE queries     │
       │                 ├──────────────────────>│
       │                 │                       │
       │                 │  [Success]            │
       │                 │<──────────────────────┤
       │                 │                       │
       │              ┌──▼────────────────────┐  │
       │              │ Post-processing:      │  │
       │              │ - Clear access cache  │  │
       │              │ - Send refund email   │  │
       │              │ - Alert admin         │  │
       │              └───────────────────────┘  │
       │                 │                       │
       │  200 OK        │                       │
       │<────────────────┤                       │
       │                 │                       │


RESULT:
  ✅ Purchase marked as refunded
  ✅ Access immediately revoked
  ✅ User reverts to free tier (hourly checks)
  ✅ Audit trail preserved (refund amount, reason, timestamp)


PARTIAL REFUND CALCULATION:
────────────────────────────

  Total purchase: 4 weeks @ $20/week = $80
  Time used: 1 week (Nov 1 - Nov 8)
  Time remaining: 3 weeks (Nov 8 - Nov 29)

  Refund calculation:
    refundAmount = pricePerWeek * weeksRemaining
    refundAmount = $20 * 3 = $60

  Manual process:
    1. Admin calculates weeks remaining
    2. Admin issues refund via Stripe dashboard
    3. Webhook processes automatically
    4. Access revoked immediately
```

---

## 7. Database Query Patterns

### Critical Performance Queries

```sql
-- Query 1: Check if user has active access (used in cron job)
-- Execution time: <50ms with proper indexing
-- Index: (userId, status, expiresAt)

SELECT
  uap.userId,
  pt.checkIntervalMinutes,
  uap.expiresAt
FROM user_access_periods uap
INNER JOIN payment_tiers pt ON uap.tierId = pt.id
WHERE uap.userId = 'user_xxx'
  AND uap.status = 'active'
  AND uap.startsAt <= NOW()
  AND uap.expiresAt >= NOW()
ORDER BY uap.expiresAt DESC
LIMIT 1;


-- Query 2: Batch access validation (cron job optimization)
-- Execution time: <100ms for 5,000 users
-- Index: (status, expiresAt, startsAt)

SELECT
  uap.userId,
  pt.checkIntervalMinutes
FROM user_access_periods uap
INNER JOIN payment_tiers pt ON uap.tierId = pt.id
WHERE uap.status = 'active'
  AND uap.startsAt <= NOW()
  AND uap.expiresAt >= NOW();


-- Query 3: Find periods expiring in next 24-48 hours
-- Execution time: <50ms with index
-- Index: (status, expiresAt)

SELECT *
FROM user_access_periods
WHERE status = 'active'
  AND expiresAt BETWEEN
    NOW() + INTERVAL '24 hours'
    AND NOW() + INTERVAL '48 hours';


-- Query 4: Mark expired access periods
-- Execution time: <100ms
-- Index: (status, expiresAt)

UPDATE user_access_periods
SET
  status = 'expired',
  updatedAt = NOW()
WHERE status = 'active'
  AND expiresAt <= NOW()
RETURNING userId;


-- Query 5: Get user's current access with tier info
-- Execution time: <30ms
-- Index: (userId, status, expiresAt)

SELECT
  uap.*,
  pt.name AS tierName,
  pt.checkIntervalMinutes,
  pt.pricePerWeekCents
FROM user_access_periods uap
INNER JOIN payment_tiers pt ON uap.tierId = pt.id
WHERE uap.userId = 'user_xxx'
  AND uap.status = 'active'
  AND uap.expiresAt >= NOW()
ORDER BY uap.expiresAt DESC
LIMIT 1;


-- Query 6: Get user's purchase history
-- Execution time: <50ms
-- Index: (userId, createdAt)

SELECT
  p.*,
  pt.name AS tierName,
  pt.checkIntervalMinutes,
  uap.expiresAt AS accessExpiresAt
FROM purchases p
INNER JOIN payment_tiers pt ON p.tierId = pt.id
LEFT JOIN user_access_periods uap ON p.accessPeriodId = uap.id
WHERE p.userId = 'user_xxx'
  AND p.status = 'completed'
ORDER BY p.createdAt DESC
LIMIT 20;
```

---

## Summary

These diagrams visualize:

1. **Purchase Flow** - Complete user journey from click to access grant
2. **Access Validation** - How cron job efficiently filters alerts by tier
3. **Access Calculation** - Date math for extending vs new access
4. **Webhook Processing** - Idempotent event handling and error recovery
5. **Expiry Management** - Automated reminders and status updates
6. **Refund Handling** - Immediate access revocation and audit trail
7. **Database Queries** - Optimized patterns with performance targets

All flows are designed for:
- ✅ **Performance**: <50ms access checks, <5s cron jobs
- ✅ **Reliability**: Transactions, idempotency, error handling
- ✅ **Auditability**: Complete event logs and state tracking
- ✅ **Scalability**: Batch queries, caching, indexed lookups
