# Payment System Implementation Guide

Quick reference for implementing the week-based payment system. This guide provides code snippets and step-by-step instructions.

---

## Quick Start Checklist

```bash
# 1. Install dependencies
npm install stripe @stripe/stripe-js

# 2. Set environment variables
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# 3. Create database migration
npx drizzle-kit generate:pg

# 4. Run migration
npx drizzle-kit migrate

# 5. Seed payment tiers
npm run seed:payment-tiers
```

---

## 1. Database Migration

Create file: `drizzle/migrations/0003_add_payment_tables.sql`

```sql
-- Payment Tiers Table
CREATE TABLE payment_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  check_interval_minutes INTEGER NOT NULL,
  price_per_week_cents INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX payment_tiers_slug_idx ON payment_tiers(slug);
CREATE UNIQUE INDEX payment_tiers_stripe_price_id_idx ON payment_tiers(stripe_price_id);
CREATE INDEX payment_tiers_is_active_idx ON payment_tiers(is_active);


-- User Access Periods Table
CREATE TABLE user_access_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tier_id UUID NOT NULL REFERENCES payment_tiers(id),
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  purchase_id UUID REFERENCES purchases(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CRITICAL INDEX for cron job performance
CREATE INDEX user_access_periods_active_idx ON user_access_periods(user_id, status, expires_at);
CREATE INDEX user_access_periods_user_id_idx ON user_access_periods(user_id);
CREATE INDEX user_access_periods_tier_id_idx ON user_access_periods(tier_id);
CREATE INDEX user_access_periods_expires_at_idx ON user_access_periods(expires_at);
CREATE INDEX user_access_periods_purchase_id_idx ON user_access_periods(purchase_id);


-- Purchases Table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tier_id UUID NOT NULL REFERENCES payment_tiers(id),
  week_quantity INTEGER NOT NULL CHECK (week_quantity BETWEEN 1 AND 6),
  price_per_week_cents INTEGER NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  access_period_id UUID REFERENCES user_access_periods(id),
  refunded_at TIMESTAMP,
  refund_amount_cents INTEGER,
  refund_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX purchases_user_id_idx ON purchases(user_id);
CREATE INDEX purchases_tier_id_idx ON purchases(tier_id);
CREATE INDEX purchases_status_idx ON purchases(status);
CREATE UNIQUE INDEX purchases_stripe_session_idx ON purchases(stripe_checkout_session_id);
CREATE UNIQUE INDEX purchases_stripe_payment_intent_idx ON purchases(stripe_payment_intent_id);
CREATE INDEX purchases_created_at_idx ON purchases(created_at);
CREATE INDEX purchases_user_history_idx ON purchases(user_id, created_at);


-- Stripe Webhook Events Table
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
  purchase_id UUID REFERENCES purchases(id),
  event_data JSONB NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  processing_attempts INTEGER NOT NULL DEFAULT 0,
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE UNIQUE INDEX stripe_webhook_events_stripe_event_id_idx ON stripe_webhook_events(stripe_event_id);
CREATE INDEX stripe_webhook_events_status_idx ON stripe_webhook_events(status);
CREATE INDEX stripe_webhook_events_event_type_idx ON stripe_webhook_events(event_type);
CREATE INDEX stripe_webhook_events_received_at_idx ON stripe_webhook_events(received_at);


-- Update alerts table
ALTER TABLE alerts
ADD COLUMN preferred_tier_id UUID REFERENCES payment_tiers(id),
ADD COLUMN last_checked TIMESTAMP;

CREATE INDEX alerts_cron_check_idx ON alerts(is_active, user_id, preferred_tier_id, last_checked);
```

---

## 2. Seed Payment Tiers

Create file: `scripts/seed-payment-tiers.ts`

```typescript
import { db } from '@/lib/db';
import { paymentTiers } from '@/lib/schema';

// NOTE: Create these in Stripe Dashboard first, then update with actual Price IDs
const tiers = [
  {
    name: '15-Minute Checks',
    slug: 'tier_15min',
    checkIntervalMinutes: 15,
    pricePerWeekCents: 2000, // $20/week
    stripePriceId: 'price_xxx_15min', // Replace with actual Stripe Price ID
    description: 'Get notified every 15 minutes - never miss a listing',
    displayOrder: 1,
    isActive: true,
  },
  {
    name: '30-Minute Checks',
    slug: 'tier_30min',
    checkIntervalMinutes: 30,
    pricePerWeekCents: 1500, // $15/week
    stripePriceId: 'price_xxx_30min', // Replace with actual Stripe Price ID
    description: 'Check for new listings every 30 minutes',
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'Hourly Checks',
    slug: 'tier_hourly',
    checkIntervalMinutes: 60,
    pricePerWeekCents: 1000, // $10/week
    stripePriceId: 'price_xxx_hourly', // Replace with actual Stripe Price ID
    description: 'Hourly updates - budget-friendly option',
    displayOrder: 3,
    isActive: true,
  },
];

async function seedPaymentTiers() {
  console.log('Seeding payment tiers...');

  for (const tier of tiers) {
    await db.insert(paymentTiers).values(tier).onConflictDoNothing();
    console.log(`✅ Seeded: ${tier.name}`);
  }

  console.log('Done!');
}

seedPaymentTiers()
  .catch(console.error)
  .finally(() => process.exit(0));
```

Run with:
```bash
npx tsx scripts/seed-payment-tiers.ts
```

---

## 3. Core Service Implementation

### Access Validation Service

Create file: `lib/services/access-validation.service.ts`

```typescript
import { db } from '@/lib/db';
import { userAccessPeriods, paymentTiers, type Alert } from '@/lib/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export interface UserAccessStatus {
  hasAccess: boolean;
  currentTier: typeof paymentTiers.$inferSelect | null;
  expiresAt: Date | null;
  checkIntervalMinutes: number;
}

/**
 * Get user's current access status
 * Used for: UI display, API authorization
 */
export async function getUserAccessStatus(
  userId: string
): Promise<UserAccessStatus> {
  const now = new Date().toISOString();

  const [result] = await db
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
        lte(userAccessPeriods.startsAt, now),
        gte(userAccessPeriods.expiresAt, now)
      )
    )
    .orderBy(desc(userAccessPeriods.expiresAt))
    .limit(1);

  if (!result) {
    return {
      hasAccess: false,
      currentTier: null,
      expiresAt: null,
      checkIntervalMinutes: 60, // Free tier
    };
  }

  return {
    hasAccess: true,
    currentTier: result.tier,
    expiresAt: new Date(result.period.expiresAt),
    checkIntervalMinutes: result.tier.checkIntervalMinutes,
  };
}

/**
 * Batch access validation - CRITICAL for cron job performance
 * Returns: Map<userId, checkIntervalMinutes>
 */
export async function batchGetUserAccessIntervals(
  userIds: string[]
): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const now = new Date().toISOString();

  const results = await db
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

  // Build map - use MINIMUM interval (fastest frequency) if multiple active periods
  const intervalMap = new Map<string, number>();
  results.forEach(({ userId, checkIntervalMinutes }) => {
    const existing = intervalMap.get(userId);
    if (!existing || checkIntervalMinutes < existing) {
      intervalMap.set(userId, checkIntervalMinutes);
    }
  });

  // Fill in free tier (60 min) for users without active access
  userIds.forEach(userId => {
    if (!intervalMap.has(userId)) {
      intervalMap.set(userId, 60);
    }
  });

  return intervalMap;
}

/**
 * Check if alert should be checked based on frequency tier and last check time
 */
export function shouldCheckAlert(
  alert: Alert,
  userCheckIntervalMinutes: number,
  currentTime: Date = new Date()
): boolean {
  if (!alert.isActive) return false;
  if (!alert.lastChecked) return true; // Never checked

  const lastCheckedTime = new Date(alert.lastChecked);
  const minutesSinceLastCheck =
    (currentTime.getTime() - lastCheckedTime.getTime()) / (1000 * 60);

  return minutesSinceLastCheck >= userCheckIntervalMinutes;
}
```

### Payment Processing Service

Create file: `lib/services/payment-processing.service.ts`

```typescript
import { db } from '@/lib/db';
import { purchases, userAccessPeriods, paymentTiers } from '@/lib/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tierId, weekQuantity } = session.metadata!;

  const tier = await db.query.paymentTiers.findFirst({
    where: eq(paymentTiers.id, tierId),
  });

  if (!tier) {
    throw new Error(`Tier ${tierId} not found`);
  }

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
    status: 'pending',
  });

  console.log(`Purchase created: ${userId}, ${weekQuantity} weeks`);
}

/**
 * Handle payment_intent.succeeded event - GRANTS ACCESS
 */
export async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, paymentIntent.id),
  });

  if (!purchase) {
    console.error(`Purchase not found for payment intent ${paymentIntent.id}`);
    return;
  }

  if (purchase.status === 'completed') {
    console.log(`Purchase ${purchase.id} already completed`);
    return;
  }

  // CRITICAL: Transaction to ensure atomic access grant
  await db.transaction(async (tx) => {
    // 1. Calculate access period
    const { startsAt, expiresAt } = await calculateAccessPeriod(
      purchase.userId,
      purchase.tierId,
      purchase.weekQuantity,
      tx
    );

    // 2. Create access period
    const [accessPeriod] = await tx
      .insert(userAccessPeriods)
      .values({
        userId: purchase.userId,
        tierId: purchase.tierId,
        startsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        purchaseId: purchase.id,
      })
      .returning();

    // 3. Update purchase
    await tx
      .update(purchases)
      .set({
        status: 'completed',
        completedAt: new Date(),
        accessPeriodId: accessPeriod.id,
      })
      .where(eq(purchases.id, purchase.id));

    console.log(`✅ Access granted: ${purchase.userId} until ${expiresAt.toISOString()}`);
  });

  // 4. Send confirmation email (outside transaction)
  // await sendPurchaseConfirmationEmail(purchase);
}

/**
 * CORE LOGIC: Calculate access period dates
 */
async function calculateAccessPeriod(
  userId: string,
  tierId: string,
  weekQuantity: number,
  tx: any
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
    console.log(`Extending access from ${startsAt.toISOString()}`);
  } else {
    // Start immediately
    startsAt = now;
    console.log(`New access starting ${startsAt.toISOString()}`);
  }

  // Add weeks (7 days each)
  const expiresAt = new Date(startsAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + weekQuantity * 7);

  return { startsAt, expiresAt };
}

/**
 * Handle charge.refunded event
 */
export async function handleRefund(charge: Stripe.Charge) {
  await db.transaction(async (tx) => {
    const purchase = await tx.query.purchases.findFirst({
      where: eq(purchases.stripePaymentIntentId, charge.payment_intent as string),
    });

    if (!purchase) return;

    // Update purchase
    await tx
      .update(purchases)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
        refundAmountCents: charge.amount_refunded,
      })
      .where(eq(purchases.id, purchase.id));

    // Cancel access period
    if (purchase.accessPeriodId) {
      await tx
        .update(userAccessPeriods)
        .set({ status: 'cancelled' })
        .where(eq(userAccessPeriods.id, purchase.accessPeriodId));
    }

    console.log(`Refund processed: ${purchase.id}`);
  });
}
```

---

## 4. API Endpoints

### Create Checkout Session

Create file: `app/api/checkout/create-session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { paymentTiers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tierId, weekQuantity } = await req.json();

    // Validation
    if (!tierId || typeof weekQuantity !== 'number') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (weekQuantity < 1 || weekQuantity > 6) {
      return NextResponse.json(
        { error: 'Week quantity must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Get tier
    const tier = await db.query.paymentTiers.findFirst({
      where: eq(paymentTiers.id, tierId),
    });

    if (!tier || !tier.isActive) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: weekQuantity,
        },
      ],
      metadata: {
        userId,
        tierId,
        weekQuantity: weekQuantity.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Stripe Webhook Handler

Create file: `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { stripeWebhookEvents } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import {
  handleCheckoutCompleted,
  handlePaymentSucceeded,
  handleRefund,
} from '@/lib/services/payment-processing.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Idempotency check
  const existingEvent = await db.query.stripeWebhookEvents.findFirst({
    where: eq(stripeWebhookEvents.stripeEventId, event.id),
  });

  if (existingEvent?.status === 'processed') {
    console.log(`Event ${event.id} already processed`);
    return NextResponse.json({ received: true });
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await db
      .update(stripeWebhookEvents)
      .set({
        status: 'processed',
        processedAt: new Date(),
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id));

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // Mark as failed
    await db
      .update(stripeWebhookEvents)
      .set({
        status: 'failed',
        errorMessage: error.message,
        errorStack: error.stack,
      })
      .where(eq(stripeWebhookEvents.stripeEventId, event.id));

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

### Get User Access Status

Create file: `app/api/user/access-status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserAccessStatus } from '@/lib/services/access-validation.service';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessStatus = await getUserAccessStatus(userId);

    return NextResponse.json(accessStatus);
  } catch (error) {
    console.error('Get access status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 5. Cron Jobs

### Updated Alert Check Cron

Update file: `app/api/cron/check-alerts/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import {
  batchGetUserAccessIntervals,
  shouldCheckAlert,
} from '@/lib/services/access-validation.service';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Get all active alerts
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.isActive, true));

    console.log(`Found ${activeAlerts.length} active alerts`);

    // 2. Get unique user IDs
    const userIds = [...new Set(activeAlerts.map(a => a.userId))];

    // 3. BATCH: Get access intervals for all users (SINGLE QUERY)
    const userIntervalMap = await batchGetUserAccessIntervals(userIds);

    // 4. Filter alerts based on access tier + last check time
    const currentTime = new Date();
    const alertsToCheck = activeAlerts.filter(alert => {
      const userInterval = userIntervalMap.get(alert.userId) || 60;
      return shouldCheckAlert(alert, userInterval, currentTime);
    });

    console.log(
      `Filtered: ${activeAlerts.length} alerts → ${alertsToCheck.length} to check ` +
      `(${Math.round((1 - alertsToCheck.length / activeAlerts.length) * 100)}% saved)`
    );

    // 5. Continue with existing batching logic...
    // (Your existing alert checking code here)

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      alertsProcessed: alertsToCheck.length,
      duration,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Mark Expired Access Cron

Create file: `app/api/cron/mark-expired-access/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userAccessPeriods } from '@/lib/schema';
import { and, eq, lte } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date().toISOString();

    const result = await db
      .update(userAccessPeriods)
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

    // TODO: Send expiry notifications

    return NextResponse.json({
      success: true,
      expiredCount: result.length,
    });
  } catch (error) {
    console.error('Mark expired access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Vercel Cron Configuration

Update file: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/mark-expired-access",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 6. Frontend Components

### Pricing Page Component

Create file: `app/pricing/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PricingTier {
  id: string;
  name: string;
  checkIntervalMinutes: number;
  pricePerWeekCents: number;
  description: string;
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [weekQuantity, setWeekQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (tierId: string) => {
    setLoading(true);

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, weekQuantity }),
      });

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">
        Choose Your Notification Speed
      </h1>

      <div className="mb-8 text-center">
        <label className="text-lg font-medium mr-4">
          How many weeks?
        </label>
        <select
          value={weekQuantity}
          onChange={(e) => setWeekQuantity(Number(e.target.value))}
          className="border rounded px-4 py-2"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} week{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card key={tier.id} className="p-6">
            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
            <p className="text-muted-foreground mb-4">{tier.description}</p>

            <div className="mb-6">
              <div className="text-3xl font-bold">
                ${(tier.pricePerWeekCents / 100).toFixed(2)}
                <span className="text-lg text-muted-foreground">/week</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Total: ${((tier.pricePerWeekCents / 100) * weekQuantity).toFixed(2)}
                {' '}for {weekQuantity} week{weekQuantity > 1 ? 's' : ''}
              </div>
            </div>

            <Button
              onClick={() => handlePurchase(tier.id)}
              disabled={loading}
              className="w-full"
            >
              Buy {weekQuantity} Week{weekQuantity > 1 ? 's' : ''}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Access Status Display

Create file: `components/access-status-banner.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AccessStatus {
  hasAccess: boolean;
  currentTier: { name: string } | null;
  expiresAt: string | null;
  checkIntervalMinutes: number;
}

export function AccessStatusBanner() {
  const [status, setStatus] = useState<AccessStatus | null>(null);

  useEffect(() => {
    fetch('/api/user/access-status')
      .then((res) => res.json())
      .then(setStatus);
  }, []);

  if (!status) return null;

  const daysRemaining = status.expiresAt
    ? Math.ceil(
        (new Date(status.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="bg-muted p-4 rounded-lg mb-6">
      {status.hasAccess ? (
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="default" className="mb-2">
              {status.currentTier?.name}
            </Badge>
            <p className="text-sm">
              Expires in {daysRemaining} days -{' '}
              {new Date(status.expiresAt!).toLocaleDateString()}
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="outline">Extend Access</Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">
              Free Tier (Hourly Checks)
            </Badge>
            <p className="text-sm">
              Upgrade for faster notifications (15-min or 30-min checks)
            </p>
          </div>
          <Link href="/pricing">
            <Button>Upgrade Now</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Testing Checklist

```bash
# Local Testing

# 1. Test Stripe webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Trigger test checkout
stripe trigger checkout.session.completed

# 3. Verify database records
psql $DATABASE_URL -c "SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM user_access_periods ORDER BY created_at DESC LIMIT 5;"

# 4. Test cron job manually
curl http://localhost:3000/api/cron/check-alerts

# 5. Check access validation
curl http://localhost:3000/api/user/access-status

# Production Testing

# 1. Use Stripe test mode
# 2. Create test purchase with test card: 4242 4242 4242 4242
# 3. Verify webhook delivery in Stripe Dashboard > Developers > Webhooks
# 4. Check Vercel cron execution logs
# 5. Monitor database for correct access periods
```

---

## 8. Common Issues & Solutions

### Issue: Webhook signature verification fails
```typescript
// Solution: Ensure webhook secret is correct
// Get from: Stripe Dashboard > Developers > Webhooks > Signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Issue: Access not granted after payment
```typescript
// Debug steps:
// 1. Check stripe_webhook_events table for 'failed' status
// 2. Check errorMessage column for details
// 3. Verify purchases.status = 'completed'
// 4. Verify user_access_periods.status = 'active'
```

### Issue: Cron job slow (>5 seconds)
```typescript
// Solution: Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'user_access_periods';

// Should see:
// - user_access_periods_active_idx
// - user_access_periods_user_id_idx
```

### Issue: Multiple active periods for same user
```typescript
// This is EXPECTED behavior
// User can have:
// - Period A: Hourly tier (2 weeks remaining)
// - Period B: 15-min tier (3 weeks remaining)
// System uses FASTEST tier (15-min) until Period B expires
```

---

## Next Steps

1. ✅ Review architecture documents
2. ✅ Set up Stripe account and create products/prices
3. ✅ Run database migration
4. ✅ Seed payment tiers with actual Stripe Price IDs
5. ✅ Implement core services
6. ✅ Create API endpoints
7. ✅ Update cron job with access filtering
8. ✅ Build frontend pricing page
9. ✅ Test end-to-end with Stripe test mode
10. ✅ Deploy and monitor

**Questions or issues?** Refer to:
- `payment-architecture.md` - Complete technical specification
- `payment-flow-diagrams.md` - Visual flow diagrams
- This guide - Implementation snippets
