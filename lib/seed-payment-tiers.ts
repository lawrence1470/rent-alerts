/**
 * Seed Payment Tiers
 *
 * Run this script to populate the payment_tiers table with the three frequency options.
 *
 * Usage: npx tsx lib/seed-payment-tiers.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { db } from './db';
import { paymentTiers } from './schema';

const TIERS = [
  {
    id: '1hour',
    name: 'Hourly Checks (Free)',
    checkInterval: '1 hour',
    pricePerWeek: 0, // Free
    checksPerDay: 24,
    stripePriceId: null, // No Stripe price for free tier
    isActive: true,
  },
  {
    id: '30min',
    name: '30-Minute Checks',
    checkInterval: '30 minutes',
    pricePerWeek: 1500, // $15.00/week in cents
    checksPerDay: 48,
    stripePriceId: null, // Will be set when Stripe product is created
    isActive: true,
  },
  {
    id: '15min',
    name: '15-Minute Checks (Premium)',
    checkInterval: '15 minutes',
    pricePerWeek: 2000, // $20.00/week in cents
    checksPerDay: 96,
    stripePriceId: null, // Will be set when Stripe product is created
    isActive: true,
  },
];

async function seedPaymentTiers() {
  console.log('🌱 Seeding payment tiers...');

  try {
    // Insert tiers (will skip if they already exist)
    for (const tier of TIERS) {
      const existing = await db.query.paymentTiers.findFirst({
        where: (tiers, { eq }) => eq(tiers.id, tier.id),
      });

      if (existing) {
        console.log(`✓ Tier "${tier.id}" already exists, skipping...`);
      } else {
        await db.insert(paymentTiers).values(tier);
        console.log(`✓ Created tier: ${tier.name} - $${tier.pricePerWeek / 100}/week`);
      }
    }

    console.log('✅ Payment tiers seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding payment tiers:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedPaymentTiers();
