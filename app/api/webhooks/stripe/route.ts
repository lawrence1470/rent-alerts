/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, calculateExpiryDate, type TierId } from '@/lib/stripe-config';
import { db } from '@/lib/db';
import { purchases, userAccessPeriods } from '@/lib/schema';
import { eq, and, gt, lte } from 'drizzle-orm';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tierId, weeks, purchaseId } = session.metadata || {};

  if (!userId || !tierId || !weeks || !purchaseId) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log(`Processing checkout completion for user ${userId}, tier ${tierId}, ${weeks} weeks`);

  // Get the purchase record
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, purchaseId),
  });

  if (!purchase) {
    console.error(`Purchase not found: ${purchaseId}`);
    return;
  }

  // Check if already processed (idempotency)
  if (purchase.status === 'completed') {
    console.log(`Purchase ${purchaseId} already completed, skipping`);
    return;
  }

  // Create access period
  const accessPeriod = await createAccessPeriod(
    userId,
    tierId as TierId,
    parseInt(weeks, 10)
  );

  // Update purchase record
  await db
    .update(purchases)
    .set({
      status: 'completed',
      accessPeriodId: accessPeriod.id,
      completedAt: new Date(),
      stripePaymentIntentId: session.payment_intent as string,
    })
    .where(eq(purchases.id, purchaseId));

  console.log(`✅ Purchase ${purchaseId} completed successfully`);
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  // Update purchase if needed
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, paymentIntent.id),
  });

  if (purchase && purchase.status !== 'completed') {
    await db
      .update(purchases)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(purchases.id, purchase.id));
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  // Mark purchase as failed
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, paymentIntent.id),
  });

  if (purchase) {
    await db
      .update(purchases)
      .set({
        status: 'failed',
      })
      .where(eq(purchases.id, purchase.id));
  }
}

/**
 * Handle charge.refunded event
 */
async function handleRefund(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent as string;

  // Find the purchase
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripePaymentIntentId, paymentIntentId),
  });

  if (!purchase) {
    console.error(`Purchase not found for payment intent: ${paymentIntentId}`);
    return;
  }

  // Mark purchase as refunded
  await db
    .update(purchases)
    .set({
      status: 'refunded',
    })
    .where(eq(purchases.id, purchase.id));

  // Mark access period as refunded
  if (purchase.accessPeriodId) {
    await db
      .update(userAccessPeriods)
      .set({
        status: 'refunded',
      })
      .where(eq(userAccessPeriods.id, purchase.accessPeriodId));
  }

  console.log(`✅ Refund processed for purchase ${purchase.id}`);
}

/**
 * Create or extend access period for a user
 * Implements additive extension model
 */
async function createAccessPeriod(userId: string, tierId: TierId, weeks: number) {
  const now = new Date();

  // Check for existing active period
  const existingPeriod = await db.query.userAccessPeriods.findFirst({
    where: and(
      eq(userAccessPeriods.userId, userId),
      eq(userAccessPeriods.tierId, tierId),
      eq(userAccessPeriods.status, 'active'),
      gt(userAccessPeriods.expiresAt, now)
    ),
    orderBy: (periods, { desc }) => [desc(periods.expiresAt)],
  });

  let startsAt: Date;
  let expiresAt: Date;

  if (existingPeriod) {
    // Extend existing period
    startsAt = existingPeriod.expiresAt;
    expiresAt = calculateExpiryDate(startsAt, weeks);

    console.log(`Extending existing period for ${userId}/${tierId} by ${weeks} weeks`);
  } else {
    // Create new period
    startsAt = now;
    expiresAt = calculateExpiryDate(startsAt, weeks);

    console.log(`Creating new period for ${userId}/${tierId} for ${weeks} weeks`);
  }

  // Insert new access period
  const [accessPeriod] = await db
    .insert(userAccessPeriods)
    .values({
      userId,
      tierId,
      startsAt,
      expiresAt,
      status: 'active',
    })
    .returning();

  return accessPeriod;
}
