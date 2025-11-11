/**
 * Stripe Checkout API
 *
 * POST /api/checkout - Create a Stripe checkout session
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe, calculatePrice, getTierConfig, type TierId } from '@/lib/stripe-config';
import { db } from '@/lib/db';
import { purchases } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tierId, weeks }: { tierId: TierId; weeks: number } = body;

    // Validation
    if (!tierId || weeks === undefined || weeks === null) {
      return NextResponse.json(
        { error: 'Missing required fields: tierId, weeks' },
        { status: 400 }
      );
    }

    if (weeks < 1 || weeks > 6) {
      return NextResponse.json(
        { error: 'Weeks must be between 1 and 6' },
        { status: 400 }
      );
    }

    if (tierId === '1hour') {
      return NextResponse.json(
        { error: 'Free tier does not require payment' },
        { status: 400 }
      );
    }

    // Get tier configuration
    const tierConfig = getTierConfig(tierId);

    // Calculate total amount
    const totalAmount = calculatePrice(tierId, weeks);

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: 'Invalid tier or price calculation' },
        { status: 400 }
      );
    }

    // Create purchase record
    const [purchase] = await db
      .insert(purchases)
      .values({
        userId,
        tierId,
        weeksPurchased: weeks,
        totalAmount,
        status: 'pending',
      })
      .returning();

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tierConfig.name} - ${weeks} week${weeks > 1 ? 's' : ''}`,
              description: `${tierConfig.checksPerDay} checks per day (every ${tierConfig.interval})`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      metadata: {
        userId,
        tierId,
        weeks: weeks.toString(),
        purchaseId: purchase.id,
      },
    });

    // Update purchase with checkout session ID
    await db
      .update(purchases)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(purchases.id, purchase.id));

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
