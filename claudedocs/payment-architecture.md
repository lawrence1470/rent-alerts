# Payment System Architecture - Week-Based Rental Notifications

## Executive Summary

This document defines a production-ready payment architecture for implementing Stripe one-time payments with week-based access control for rental notification frequency tiers.

**Key Design Goals:**
- Week-based pricing with 3 frequency tiers (15-min, 30-min, hourly checks)
- Additive access extension (purchases stack, not replace)
- Efficient cron job filtering (only check paid users)
- Complete audit trail for compliance and debugging
- Handle edge cases: upgrades, refunds, concurrent purchases, timezone handling

---

## 1. Database Schema Design

### 1.1 New Tables

#### `payment_tiers` - Frequency Tier Definitions
```typescript
export const paymentTiers = pgTable('payment_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Tier Definition
  name: text('name').notNull().unique(), // "15-minute", "30-minute", "hourly"
  slug: text('slug').notNull().unique(), // "tier_15min", "tier_30min", "tier_hourly"
  checkIntervalMinutes: integer('check_interval_minutes').notNull(), // 15, 30, 60

  // Pricing
  pricePerWeekCents: integer('price_per_week_cents').notNull(), // 2000, 1500, 1000
  stripePriceId: text('stripe_price_id').notNull().unique(), // Stripe Price ID

  // Display
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('payment_tiers_slug_idx').on(table.slug),
  stripePriceIdIdx: uniqueIndex('payment_tiers_stripe_price_id_idx').on(table.stripePriceId),
  isActiveIdx: index('payment_tiers_is_active_idx').on(table.isActive),
}));
```

#### `user_access_periods` - Active Access Tracking
```typescript
export const userAccessPeriods = pgTable('user_access_periods', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User & Tier
  userId: text('user_id').notNull(), // Clerk user ID
  tierId: uuid('tier_id').notNull().references(() => paymentTiers.id),

  // Access Period (week-based precision)
  startsAt: timestamp('starts_at', { mode: 'string' }).notNull(), // ISO 8601 UTC
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(), // ISO 8601 UTC

  // Status
  status: text('status', {
    enum: ['pending', 'active', 'expired', 'cancelled']
  }).notNull().default('pending'),

  // Source Tracking
  purchaseId: uuid('purchase_id').references(() => purchases.id), // Which purchase created this

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // CRITICAL: Fast lookup for cron job filtering
  activeAccessIdx: index('user_access_periods_active_idx').on(
    table.userId,
    table.status,
    table.expiresAt
  ),
  userIdIdx: index('user_access_periods_user_id_idx').on(table.userId),
  tierIdIdx: index('user_access_periods_tier_id_idx').on(table.tierId),
  expiresAtIdx: index('user_access_periods_expires_at_idx').on(table.expiresAt),
  purchaseIdIdx: index('user_access_periods_purchase_id_idx').on(table.purchaseId),
}));
```

#### `purchases` - Purchase History & Audit Trail
```typescript
export const purchases = pgTable('purchases', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User & Tier
  userId: text('user_id').notNull(), // Clerk user ID
  tierId: uuid('tier_id').notNull().references(() => paymentTiers.id),

  // Purchase Details
  weekQuantity: integer('week_quantity').notNull(), // 1-6 weeks purchased
  pricePerWeekCents: integer('price_per_week_cents').notNull(), // Snapshot at purchase time
  totalAmountCents: integer('total_amount_cents').notNull(), // weekQuantity * pricePerWeek
  currency: text('currency').notNull().default('usd'),

  // Stripe Data
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),

  // Status Tracking
  status: text('status', {
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed']
  }).notNull().default('pending'),

  // Access Period Created
  accessPeriodId: uuid('access_period_id').references(() => userAccessPeriods.id),

  // Refund Tracking
  refundedAt: timestamp('refunded_at'),
  refundAmountCents: integer('refund_amount_cents'),
  refundReason: text('refund_reason'),

  // Metadata
  metadata: jsonb('metadata'), // Store additional context (IP, user agent, etc.)

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('purchases_user_id_idx').on(table.userId),
  tierIdIdx: index('purchases_tier_id_idx').on(table.tierId),
  statusIdx: index('purchases_status_idx').on(table.status),
  stripeCheckoutSessionIdIdx: uniqueIndex('purchases_stripe_session_idx').on(table.stripeCheckoutSessionId),
  stripePaymentIntentIdIdx: uniqueIndex('purchases_stripe_payment_intent_idx').on(table.stripePaymentIntentId),
  createdAtIdx: index('purchases_created_at_idx').on(table.createdAt),
  // Audit trail queries
  userPurchaseHistoryIdx: index('purchases_user_history_idx').on(table.userId, table.createdAt),
}));
```

#### `stripe_webhook_events` - Webhook Deduplication & Debugging
```typescript
export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Stripe Event Data
  stripeEventId: text('stripe_event_id').notNull().unique(), // evt_xxx
  eventType: text('event_type').notNull(), // checkout.session.completed, payment_intent.succeeded, etc.

  // Processing Status
  status: text('status', {
    enum: ['pending', 'processed', 'failed', 'ignored']
  }).notNull().default('pending'),

  // Related Records
  purchaseId: uuid('purchase_id').references(() => purchases.id),

  // Raw Data (for debugging)
  eventData: jsonb('event_data').notNull(), // Full Stripe event object

  // Error Tracking
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  processingAttempts: integer('processing_attempts').default(0).notNull(),

  // Timestamps
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  stripeEventIdIdx: uniqueIndex('stripe_webhook_events_stripe_event_id_idx').on(table.stripeEventId),
  statusIdx: index('stripe_webhook_events_status_idx').on(table.status),
  eventTypeIdx: index('stripe_webhook_events_event_type_idx').on(table.eventType),
  receivedAtIdx: index('stripe_webhook_events_received_at_idx').on(table.receivedAt),
}));
```

### 1.2 Schema Updates to Existing Tables

#### Modify `alerts` table:
```typescript
// ADD these columns to existing alerts table:
export const alerts = pgTable('alerts', {
  // ... existing columns ...

  // NEW: Payment tier preference
  preferredTierId: uuid('preferred_tier_id').references(() => paymentTiers.id),

  // NEW: Last check timestamp for frequency enforcement
  lastChecked: timestamp('last_checked'),

  // ... rest of existing columns ...
}, (table) => ({
  // ... existing indexes ...

  // NEW: Index for cron filtering
  cronCheckIdx: index('alerts_cron_check_idx').on(
    table.isActive,
    table.userId,
    table.preferredTierId,
    table.lastChecked
  ),
}));
```

---

## 2. Access Validation Service

### 2.1 Core Access Check Logic

```typescript
// lib/services/access-validation.service.ts

import { db } from '@/lib/db';
import { userAccessPeriods, paymentTiers, alerts } from '@/lib/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export interface UserAccessStatus {
  hasAccess: boolean;
  currentTier: PaymentTier | null;
  expiresAt: Date | null;
  checkIntervalMinutes: number; // Defaults to 60 (hourly) for free tier
}

/**
 * CRITICAL: This function is called by cron job every 15 minutes
 * Must be FAST (<50ms) for scalability
 */
export async function getUserAccessStatus(
  userId: string,
  asOfTime: Date = new Date()
): Promise<UserAccessStatus> {
  const now = asOfTime.toISOString();

  // Query for active access period
  const activePeriods = await db
    .select({
      tier: paymentTiers,
      period: userAccessPeriods,
    })
    .from(userAccessPeriods)
    .innerJoin(paymentTiers, eq(userAccessPeriods.tierId, paymentTiers.id))
    .where(
      and(
        eq(userAccessPeriods.userId, userId),
        eq(userAccessPeriods.status, 'active'),
        lte(userAccessPeriods.startsAt, now), // Period has started
        gte(userAccessPeriods.expiresAt, now)  // Period hasn't expired
      )
    )
    .orderBy(desc(userAccessPeriods.expiresAt)) // Latest expiry first
    .limit(1);

  if (activePeriods.length === 0) {
    // No active access - default to free tier (hourly checks)
    return {
      hasAccess: false,
      currentTier: null,
      expiresAt: null,
      checkIntervalMinutes: 60, // Free tier = hourly
    };
  }

  const { tier, period } = activePeriods[0];

  return {
    hasAccess: true,
    currentTier: tier,
    expiresAt: new Date(period.expiresAt),
    checkIntervalMinutes: tier.checkIntervalMinutes,
  };
}

/**
 * Batch access validation for cron job efficiency
 * Returns map of userId -> checkIntervalMinutes
 */
export async function batchGetUserAccessIntervals(
  userIds: string[]
): Promise<Map<string, number>> {
  const now = new Date().toISOString();

  const accessData = await db
    .select({
      userId: userAccessPeriods.userId,
      checkIntervalMinutes: paymentTiers.checkIntervalMinutes,
    })
    .from(userAccessPeriods)
    .innerJoin(paymentTiers, eq(userAccessPeriods.tierId, paymentTiers.id))
    .where(
      and(
        eq(userAccessPeriods.status, 'active'),
        lte(userAccessPeriods.startsAt, now),
        gte(userAccessPeriods.expiresAt, now)
      )
    );

  const intervalMap = new Map<string, number>();

  // Build map (takes highest frequency if multiple active periods)
  accessData.forEach(({ userId, checkIntervalMinutes }) => {
    const existing = intervalMap.get(userId);
    if (!existing || checkIntervalMinutes < existing) {
      intervalMap.set(userId, checkIntervalMinutes);
    }
  });

  // Fill in free tier (60 min) for users without active access
  userIds.forEach(userId => {
    if (!intervalMap.has(userId)) {
      intervalMap.set(userId, 60); // Free tier
    }
  });

  return intervalMap;
}

/**
 * Check if user should be checked based on their frequency tier
 * and last check time
 */
export function shouldCheckAlert(
  alert: Alert,
  userCheckIntervalMinutes: number,
  currentTime: Date = new Date()
): boolean {
  if (!alert.isActive) return false;
  if (!alert.lastChecked) return true; // Never checked before

  const lastCheckedTime = new Date(alert.lastChecked);
  const minutesSinceLastCheck =
    (currentTime.getTime() - lastCheckedTime.getTime()) / (1000 * 60);

  return minutesSinceLastCheck >= userCheckIntervalMinutes;
}
```

### 2.2 Cron Job Integration

```typescript
// lib/services/cron-job.service.ts (UPDATED)

import { getUserAccessStatus, batchGetUserAccessIntervals, shouldCheckAlert } from './access-validation.service';

export async function runAlertCheckCronJob() {
  const startTime = Date.now();

  // 1. Get all active alerts
  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.isActive, true));

  // 2. Get unique user IDs
  const userIds = [...new Set(activeAlerts.map(a => a.userId))];

  // 3. BATCH validate access for all users (single query)
  const userIntervalMap = await batchGetUserAccessIntervals(userIds);

  // 4. Filter alerts based on access + frequency
  const currentTime = new Date();
  const alertsToCheck = activeAlerts.filter(alert => {
    const userInterval = userIntervalMap.get(alert.userId) || 60; // Default free tier
    return shouldCheckAlert(alert, userInterval, currentTime);
  });

  console.log(`Filtering: ${activeAlerts.length} active alerts → ${alertsToCheck.length} to check`);

  // 5. Continue with existing batching logic...
  // (Rest of cron job logic remains the same)
}
```

---

## 3. Purchase Flow & Stripe Integration

### 3.1 Purchase Flow Diagram

```
User Clicks "Buy 3 Weeks @ $20/week"
              ↓
    Create Stripe Checkout Session
    - line_item: price_xxx (Stripe Price ID), quantity: 3
    - metadata: { userId, tierId, weekQuantity: 3 }
    - success_url, cancel_url
              ↓
        User Redirected to Stripe
              ↓
        User Completes Payment
              ↓
    Stripe Webhook: checkout.session.completed
              ↓
    Create Purchase Record (status: pending)
              ↓
    Stripe Webhook: payment_intent.succeeded
              ↓
    ┌─────────────────────────────────────┐
    │  Transaction Processing (CRITICAL)  │
    │                                     │
    │  1. Update Purchase (status: completed)
    │  2. Calculate Access Period:        │
    │     - Get current active period     │
    │     - If exists: extend from expiry │
    │     - If not: start from now        │
    │     - Add weekQuantity weeks        │
    │  3. Create UserAccessPeriod         │
    │  4. Link Purchase ↔ AccessPeriod   │
    │  5. Send confirmation email         │
    └─────────────────────────────────────┘
              ↓
        Access Activated
```

### 3.2 API Endpoint Design

#### `POST /api/checkout/create-session`
```typescript
/**
 * Creates Stripe checkout session for week-based purchase
 *
 * Body: {
 *   tierId: string,      // UUID of payment tier
 *   weekQuantity: number // 1-6 weeks
 * }
 */
export async function POST(req: Request) {
  const { userId } = auth(); // Clerk auth
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tierId, weekQuantity } = await req.json();

  // Validation
  if (weekQuantity < 1 || weekQuantity > 6) {
    return Response.json({ error: 'Invalid week quantity' }, { status: 400 });
  }

  // Get tier data
  const tier = await db.query.paymentTiers.findFirst({
    where: eq(paymentTiers.id, tierId)
  });

  if (!tier || !tier.isActive) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // One-time payment
    line_items: [
      {
        price: tier.stripePriceId,
        quantity: weekQuantity, // Quantity = number of weeks
      },
    ],
    customer_email: userEmail, // Optional: pre-fill from Clerk
    metadata: {
      userId,
      tierId,
      weekQuantity: weekQuantity.toString(),
      tierSlug: tier.slug,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });

  return Response.json({ sessionId: session.id, url: session.url });
}
```

#### `POST /api/webhooks/stripe`
```typescript
/**
 * Handles Stripe webhook events
 *
 * Events:
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 * - charge.dispute.created
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: Check if event already processed
  const existingEvent = await db.query.stripeWebhookEvents.findFirst({
    where: eq(stripeWebhookEvents.stripeEventId, event.id)
  });

  if (existingEvent?.status === 'processed') {
    console.log(`Event ${event.id} already processed, skipping`);
    return Response.json({ received: true });
  }

  // Log event
  await db.insert(stripeWebhookEvents).values({
    stripeEventId: event.id,
    eventType: event.type,
    eventData: event as any,
    status: 'pending',
  });

  try {
    // Route to handler
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;
      case 'charge.refunded':
        await handleRefund(event);
        break;
      case 'charge.dispute.created':
        await handleDispute(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await db.update(stripeWebhookEvents)
      .set({
        status: 'processed',
        processedAt: new Date()
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id));

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Mark event as failed
    await db.update(stripeWebhookEvents)
      .set({
        status: 'failed',
        errorMessage: error.message,
        errorStack: error.stack,
        processingAttempts: sql`${stripeWebhookEvents.processingAttempts} + 1`,
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id));

    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

### 3.3 Webhook Handler Functions

```typescript
// lib/services/payment-processing.service.ts

import { db } from '@/lib/db';
import { purchases, userAccessPeriods, paymentTiers } from '@/lib/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, tierId, weekQuantity } = session.metadata!;

  // Get tier data
  const tier = await db.query.paymentTiers.findFirst({
    where: eq(paymentTiers.id, tierId)
  });

  if (!tier) {
    throw new Error(`Tier ${tierId} not found`);
  }

  // Create purchase record
  await db.insert(purchases).values({
    userId,
    tierId,
    weekQuantity: parseInt(weekQuantity),
    pricePerWeekCents: tier.pricePerWeekCents,
    totalAmountCents: tier.pricePerWeekCents * parseInt(weekQuantity),
    currency: 'usd',
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    stripeCustomerId: session.customer as string,
    status: 'pending', // Wait for payment_intent.succeeded
  });

  console.log(`Purchase created for user ${userId}: ${weekQuantity} weeks`);
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Find purchase record
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, paymentIntent.id)
  });

  if (!purchase) {
    console.error(`Purchase not found for payment intent ${paymentIntent.id}`);
    return;
  }

  if (purchase.status === 'completed') {
    console.log(`Purchase ${purchase.id} already completed, skipping`);
    return;
  }

  // === CRITICAL: Transaction for atomic access grant ===
  await db.transaction(async (tx) => {

    // 1. Calculate access period dates
    const { startsAt, expiresAt } = await calculateAccessPeriod(
      purchase.userId,
      purchase.tierId,
      purchase.weekQuantity,
      tx
    );

    // 2. Create access period
    const [accessPeriod] = await tx.insert(userAccessPeriods).values({
      userId: purchase.userId,
      tierId: purchase.tierId,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      purchaseId: purchase.id,
    }).returning();

    // 3. Update purchase record
    await tx.update(purchases)
      .set({
        status: 'completed',
        completedAt: new Date(),
        accessPeriodId: accessPeriod.id,
      })
      .where(eq(purchases.id, purchase.id));

    console.log(`Access granted: ${purchase.userId} until ${expiresAt.toISOString()}`);
  });

  // 4. Send confirmation email (outside transaction)
  await sendPurchaseConfirmationEmail(purchase);
}

/**
 * CORE LOGIC: Calculate when access starts and expires
 *
 * Rules:
 * - If user has active access: extend from current expiry
 * - If no active access: start immediately
 * - Always add full weeks (7 days * 24 hours)
 */
async function calculateAccessPeriod(
  userId: string,
  tierId: string,
  weekQuantity: number,
  tx: any // Transaction context
): Promise<{ startsAt: Date; expiresAt: Date }> {
  const now = new Date();
  const nowISO = now.toISOString();

  // Check for existing active access
  const existingPeriod = await tx.query.userAccessPeriods.findFirst({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.status, 'active'),
      gte(userAccessPeriods.expiresAt, nowISO)
    ),
    orderBy: [desc(userAccessPeriods.expiresAt)],
  });

  let startsAt: Date;

  if (existingPeriod) {
    // Extend from existing expiry
    startsAt = new Date(existingPeriod.expiresAt);
    console.log(`Extending access for ${userId} from ${startsAt.toISOString()}`);
  } else {
    // Start immediately
    startsAt = now;
    console.log(`New access for ${userId} starting ${startsAt.toISOString()}`);
  }

  // Calculate expiry: add full weeks (7 days each)
  const expiresAt = new Date(startsAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + (weekQuantity * 7));

  return { startsAt, expiresAt };
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  await db.update(purchases)
    .set({ status: 'failed' })
    .where(eq(purchases.stripePaymentIntentId, paymentIntent.id));

  // TODO: Send failure notification email
}

async function handleRefund(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  await db.transaction(async (tx) => {
    // Find purchase
    const purchase = await tx.query.purchases.findFirst({
      where: eq(purchases.stripePaymentIntentId, charge.payment_intent as string)
    });

    if (!purchase) return;

    // Update purchase
    await tx.update(purchases)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
        refundAmountCents: charge.amount_refunded,
      })
      .where(eq(purchases.id, purchase.id));

    // Cancel access period
    if (purchase.accessPeriodId) {
      await tx.update(userAccessPeriods)
        .set({ status: 'cancelled' })
        .where(eq(userAccessPeriods.id, purchase.accessPeriodId));
    }
  });
}

async function handleDispute(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;

  await db.update(purchases)
    .set({ status: 'disputed' })
    .where(eq(purchases.stripePaymentIntentId, dispute.payment_intent as string));

  // TODO: Alert admin, freeze access
}
```

---

## 4. Expiry Handling Strategy

### 4.1 Automatic Expiry Detection

```typescript
// lib/services/expiry-management.service.ts

/**
 * Cron job: Runs every hour to mark expired access periods
 * Should run at :00 of every hour (e.g., 10:00, 11:00, 12:00)
 */
export async function markExpiredAccessPeriods() {
  const now = new Date().toISOString();

  const result = await db.update(userAccessPeriods)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userAccessPeriods.status, 'active'),
        lte(userAccessPeriods.expiresAt, now)
      )
    )
    .returning({ userId: userAccessPeriods.userId });

  console.log(`Marked ${result.length} access periods as expired`);

  // Send expiry notifications
  for (const { userId } of result) {
    await sendExpiryNotification(userId);
  }

  return result;
}

/**
 * Send "Your access is expiring soon" notification
 * Runs 24 hours before expiry
 */
export async function sendExpiryReminders() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const expiringPeriods = await db.query.userAccessPeriods.findMany({
    where: and(
      eq(userAccessPeriods.status, 'active'),
      gte(userAccessPeriods.expiresAt, now.toISOString()),
      lte(userAccessPeriods.expiresAt, in24Hours.toISOString())
    ),
    with: {
      tier: true,
    },
  });

  for (const period of expiringPeriods) {
    await sendExpiryReminderEmail(period.userId, period.expiresAt, period.tier);
  }
}
```

### 4.2 Graceful Degradation

**Strategy**: When access expires, user doesn't lose alerts - they just revert to **free tier (hourly checks)**

```typescript
// Cron job logic handles this automatically:
// 1. User with no active access gets checkInterval = 60 minutes
// 2. Their alerts continue running, just less frequently
// 3. They see banner: "Upgrade to 15-min checks for faster notifications"
```

### 4.3 Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/mark-expired-access",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-expiry-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 5. Edge Cases & Solutions

### 5.1 Frequency Tier Upgrade Mid-Period

**Scenario**: User has 2 weeks of "hourly" tier remaining, wants to upgrade to "15-minute" tier.

**Solution 1 - Recommended: Separate Periods (Stack)**
- Allow purchase of new tier
- User now has TWO active periods:
  - Period A: Hourly (2 weeks remaining)
  - Period B: 15-minute (just purchased 3 weeks)
- Cron job uses **highest frequency** (15-min) until Period A expires
- After Period A expires, user continues with Period B (15-min)

```typescript
// Access validation logic already handles this:
// batchGetUserAccessIntervals() takes MINIMUM checkInterval (highest frequency)
const existing = intervalMap.get(userId);
if (!existing || checkIntervalMinutes < existing) {
  intervalMap.set(userId, checkIntervalMinutes); // Use fastest
}
```

**Solution 2 - Alternative: Refund & Replace**
- Calculate prorated refund for remaining time on old tier
- Issue Stripe refund
- Create new purchase for upgraded tier
- More complex, not recommended

**Recommendation**: Implement Solution 1 (stack periods). Simpler, no refund complexity.

### 5.2 Refunds & Chargebacks

**Refund Handling**:
```typescript
// When refund issued:
// 1. Set purchase.status = 'refunded'
// 2. Set accessPeriod.status = 'cancelled'
// 3. User immediately loses paid access
// 4. User reverts to free tier (hourly checks)

// Partial refunds:
// - If user bought 4 weeks, used 1 week, refund = 3 weeks worth
// - Cancel remaining access period
// - Create new shorter period for used portion
```

**Chargeback Handling**:
```typescript
// Stripe webhook: charge.dispute.created
// 1. Set purchase.status = 'disputed'
// 2. Freeze access (set status = 'cancelled')
// 3. Alert admin for review
// 4. If dispute resolved in favor of business, restore access
```

### 5.3 Multiple Rapid Purchases

**Scenario**: User clicks "Buy 3 weeks" twice in 5 seconds.

**Protection Mechanisms**:

1. **Frontend**: Disable button after click, show loading state
2. **Stripe**: Idempotency keys prevent duplicate charges
3. **Database**: `stripeWebhookEvents.stripeEventId` unique constraint prevents duplicate processing
4. **Transaction**: All access grants happen in DB transaction

```typescript
// Webhook handler checks for duplicate events:
const existingEvent = await db.query.stripeWebhookEvents.findFirst({
  where: eq(stripeWebhookEvents.stripeEventId, event.id)
});

if (existingEvent?.status === 'processed') {
  console.log('Already processed, skipping');
  return;
}
```

**Result**: Second purchase is processed separately, access periods stack correctly.

### 5.4 Clock Drift & Timezone Handling

**Problem**: Server timezone differences, DST changes, clock drift.

**Solution**: **All timestamps stored as UTC ISO 8601 strings**

```typescript
// ALWAYS use UTC:
const now = new Date().toISOString(); // "2024-11-08T12:00:00.000Z"

// Database columns:
startsAt: timestamp('starts_at', { mode: 'string' }) // Returns ISO string, not Date object

// Comparisons:
gte(userAccessPeriods.expiresAt, now) // String comparison in UTC

// Display to users:
new Date(period.expiresAt).toLocaleString('en-US', { timeZone: userTimezone })
```

**Week Calculations**:
```typescript
// Add weeks using UTC date methods:
const expiresAt = new Date(startsAt);
expiresAt.setUTCDate(expiresAt.getUTCDate() + (weekQuantity * 7));

// NOT: expiresAt.setDate() - uses local time, breaks with DST
```

### 5.5 Free Trial Handling

**Option 1 - No Free Trial**: Users must pay to access faster frequencies.

**Option 2 - Limited Free Trial**: Give new users 1 week of 15-min tier.

```typescript
// On user signup (Clerk webhook):
async function grantTrialAccess(userId: string) {
  const trialTier = await db.query.paymentTiers.findFirst({
    where: eq(paymentTiers.slug, 'tier_15min')
  });

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 7); // 1 week

  await db.insert(userAccessPeriods).values({
    userId,
    tierId: trialTier.id,
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    purchaseId: null, // No purchase for trial
  });
}
```

---

## 6. API Endpoints Summary

### Frontend-Facing Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/payment-tiers` | GET | List available pricing tiers | Public |
| `/api/checkout/create-session` | POST | Create Stripe checkout session | Clerk |
| `/api/user/access-status` | GET | Get user's current access status | Clerk |
| `/api/user/purchase-history` | GET | Get user's purchase history | Clerk |
| `/api/user/extend-access` | POST | Quick "extend by 1 week" button | Clerk |

### Webhook Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/webhooks/stripe` | POST | Handle Stripe webhook events | Stripe signature |

### Admin Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/admin/access-periods` | GET | View all access periods | Admin |
| `/api/admin/grant-access` | POST | Manually grant access | Admin |
| `/api/admin/revoke-access` | POST | Manually revoke access | Admin |

### Cron Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/cron/check-alerts` | GET | Run alert check job (every 15 min) | Vercel Cron |
| `/api/cron/mark-expired-access` | GET | Mark expired periods (hourly) | Vercel Cron |
| `/api/cron/send-expiry-reminders` | GET | Send 24h reminders (daily at 9am) | Vercel Cron |

---

## 7. Performance Considerations

### 7.1 Database Indexes (Critical)

**Most Important Index** - Cron job filtering:
```typescript
// This index makes "get users with active access" query <50ms
index('user_access_periods_active_idx').on(
  table.userId,
  table.status,
  table.expiresAt
)
```

**Query Plan**:
```sql
-- Without index: Full table scan (10K+ rows) = 500ms+
-- With index: Index scan (filtered in memory) = <50ms

SELECT userId, checkIntervalMinutes
FROM user_access_periods
INNER JOIN payment_tiers ON user_access_periods.tierId = payment_tiers.id
WHERE status = 'active'
  AND startsAt <= NOW()
  AND expiresAt >= NOW();
```

### 7.2 Caching Strategy

**Access Status Cache** (Redis/Vercel KV):
```typescript
// Cache key: `access:${userId}`
// TTL: 15 minutes (matches cron interval)

export async function getUserAccessStatusCached(userId: string) {
  const cacheKey = `access:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Miss: fetch from DB
  const status = await getUserAccessStatus(userId);

  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(status));

  return status;
}

// Invalidate cache on purchase completion:
await redis.del(`access:${userId}`);
```

**Tier Data Cache** (In-memory):
```typescript
// Tiers change rarely, cache in Node.js memory
let tierCache: PaymentTier[] | null = null;
let tierCacheExpiry: number = 0;

export async function getPaymentTiers(): Promise<PaymentTier[]> {
  const now = Date.now();

  if (tierCache && now < tierCacheExpiry) {
    return tierCache;
  }

  tierCache = await db.query.paymentTiers.findMany({
    where: eq(paymentTiers.isActive, true),
    orderBy: [asc(paymentTiers.displayOrder)],
  });

  tierCacheExpiry = now + 3600000; // 1 hour

  return tierCache;
}
```

### 7.3 Batch Processing

**Cron Job Optimization**:
```typescript
// BEFORE: Query DB for each user (N queries)
for (const alert of alerts) {
  const access = await getUserAccessStatus(alert.userId); // BAD: N queries
}

// AFTER: Single batch query for all users
const userIds = [...new Set(alerts.map(a => a.userId))];
const accessMap = await batchGetUserAccessIntervals(userIds); // GOOD: 1 query

// Use cached results
for (const alert of alerts) {
  const interval = accessMap.get(alert.userId);
  // ...
}
```

### 7.4 Scalability Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Access check query | <50ms | Composite index on (userId, status, expiresAt) |
| Cron job total time | <5 seconds | Batch queries, parallel API calls |
| Webhook processing | <200ms | Async email, transaction for DB writes |
| Concurrent purchases | 1000/sec | Stripe handles load, DB uses transactions |
| Active users | 100K+ | Indexed queries, Redis caching |

---

## 8. Type Definitions

```typescript
// lib/types/payment.types.ts

export interface PaymentTier {
  id: string;
  name: string;
  slug: string;
  checkIntervalMinutes: number;
  pricePerWeekCents: number;
  stripePriceId: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface UserAccessPeriod {
  id: string;
  userId: string;
  tierId: string;
  startsAt: string; // ISO 8601 UTC
  expiresAt: string; // ISO 8601 UTC
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  purchaseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  userId: string;
  tierId: string;
  weekQuantity: number;
  pricePerWeekCents: number;
  totalAmountCents: number;
  currency: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  accessPeriodId: string | null;
  refundedAt: Date | null;
  refundAmountCents: number | null;
  refundReason: string | null;
  metadata: any;
  createdAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface CreateCheckoutSessionRequest {
  tierId: string;
  weekQuantity: number; // 1-6
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface UserAccessStatus {
  hasAccess: boolean;
  currentTier: PaymentTier | null;
  expiresAt: Date | null;
  checkIntervalMinutes: number;
}
```

---

## 9. Implementation Checklist

### Phase 1: Database Setup
- [ ] Create migration for 4 new tables
- [ ] Add columns to `alerts` table
- [ ] Create all indexes
- [ ] Seed `payment_tiers` table with initial data

### Phase 2: Stripe Setup
- [ ] Create Stripe products and prices
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test webhook signature verification
- [ ] Set up webhook event logging

### Phase 3: Core Services
- [ ] Implement `access-validation.service.ts`
- [ ] Implement `payment-processing.service.ts`
- [ ] Implement `expiry-management.service.ts`
- [ ] Update `cron-job.service.ts` with access filtering

### Phase 4: API Endpoints
- [ ] `POST /api/checkout/create-session`
- [ ] `POST /api/webhooks/stripe`
- [ ] `GET /api/payment-tiers`
- [ ] `GET /api/user/access-status`
- [ ] `GET /api/user/purchase-history`

### Phase 5: Cron Jobs
- [ ] Update `/api/cron/check-alerts` with access filtering
- [ ] Create `/api/cron/mark-expired-access`
- [ ] Create `/api/cron/send-expiry-reminders`
- [ ] Update `vercel.json` with cron schedules

### Phase 6: Frontend Integration
- [ ] Pricing page with tier cards
- [ ] Checkout flow
- [ ] Payment success/cancel pages
- [ ] Dashboard: access status display
- [ ] Dashboard: purchase history
- [ ] Expiry warning banner

### Phase 7: Testing
- [ ] Unit tests for access validation logic
- [ ] Integration tests for webhook handlers
- [ ] End-to-end purchase flow test
- [ ] Edge case tests (refunds, multiple purchases, upgrades)
- [ ] Load test cron job with 10K+ alerts

### Phase 8: Monitoring
- [ ] Stripe webhook delivery monitoring
- [ ] Cron job execution logs
- [ ] Access grant/revoke audit trail
- [ ] Failed payment alerts
- [ ] Expiry notification success rate

---

## 10. Security Considerations

### 10.1 Webhook Security
- ✅ Verify Stripe signature on all webhook requests
- ✅ Use environment variable for webhook secret
- ✅ Log all webhook events for audit trail
- ✅ Implement idempotency to prevent duplicate processing

### 10.2 Access Control
- ✅ Clerk authentication on all payment endpoints
- ✅ Users can only view their own purchase history
- ✅ Admin endpoints require role-based access
- ✅ Cron endpoints protected by Vercel cron secret

### 10.3 Data Integrity
- ✅ Use database transactions for access grants
- ✅ Unique constraints on Stripe IDs
- ✅ Foreign key constraints for referential integrity
- ✅ Validate week quantity (1-6) before creating checkout

### 10.4 PCI Compliance
- ✅ Never store credit card numbers (Stripe handles)
- ✅ Use Stripe Checkout (hosted payment page)
- ✅ No PCI compliance burden on application
- ✅ Store only Stripe IDs, not payment details

---

## 11. Monitoring & Alerting

### Key Metrics to Track

```typescript
// Grafana/Datadog dashboard

// Revenue Metrics
- Total revenue (daily/weekly/monthly)
- Revenue by tier
- Average purchase size
- Purchase conversion rate

// Access Metrics
- Active paid users
- Users by tier
- Access expiring in next 7 days
- Access renewal rate

// Operational Metrics
- Webhook processing time (p50, p95, p99)
- Webhook failure rate
- Cron job execution time
- Cron job success rate

// User Behavior
- Upgrade rate (hourly → 30-min → 15-min)
- Purchase frequency (how often users buy more weeks)
- Churn rate (users who don't renew)
```

### Alerts to Configure

```yaml
Critical Alerts:
  - Webhook failure rate > 5%
  - Cron job failure
  - Access grant transaction failure
  - Stripe API errors

Warning Alerts:
  - Webhook processing time > 500ms
  - Cron job execution time > 10 seconds
  - Unusual refund rate (> 2%)
  - Payment failures > 10%
```

---

## Conclusion

This architecture provides:

✅ **Week-based pricing** with 3 frequency tiers
✅ **Additive access** (purchases extend, not replace)
✅ **Efficient cron filtering** (only check paid users at their frequency)
✅ **Complete audit trail** (purchases, access periods, webhooks)
✅ **Robust edge case handling** (refunds, upgrades, concurrent purchases)
✅ **Production-ready performance** (<50ms access checks, <5s cron jobs)
✅ **Secure & compliant** (Stripe handles PCI, webhook verification)

**Next Steps**: Review this architecture, ask clarifying questions, then proceed with implementation checklist.
