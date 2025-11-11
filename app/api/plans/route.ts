import { NextResponse } from 'next/server';
import { TIER_CONFIG, formatPrice } from '@/lib/stripe-config';

/**
 * GET /api/plans - Fetch available pricing plans
 */
export async function GET() {
  try {
    // Return tier configuration from our local config
    // This matches what's in our database payment_tiers table
    const plans = Object.entries(TIER_CONFIG).map(([id, config]) => ({
      id,
      name: config.name,
      pricePerWeek: config.pricePerWeek,
      priceFormatted: formatPrice(config.pricePerWeek),
      interval: config.interval,
      checksPerDay: config.checksPerDay,
      isFree: config.pricePerWeek === 0,
    }));

    return NextResponse.json({
      success: true,
      plans,
      totalCount: plans.length,
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch plans',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
