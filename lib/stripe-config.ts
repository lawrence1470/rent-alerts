/**
 * Stripe Configuration
 *
 * Server-side Stripe configuration and helpers for payment processing
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// Initialize Stripe with API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Tier configuration matching payment_tiers table
export const TIER_CONFIG = {
  '1hour': {
    id: '1hour',
    name: 'Hourly Checks (Free)',
    pricePerWeek: 0, // Free
    interval: '1 hour',
    checksPerDay: 24,
  },
  '1hour-sms': {
    id: '1hour-sms',
    name: 'Hourly Checks + SMS',
    pricePerWeek: 500, // $5.00 in cents
    interval: '1 hour',
    checksPerDay: 24,
  },
  '30min': {
    id: '30min',
    name: '30-Minute Checks',
    pricePerWeek: 1500, // $15.00 in cents
    interval: '30 minutes',
    checksPerDay: 48,
  },
  '15min': {
    id: '15min',
    name: '15-Minute Checks (Premium)',
    pricePerWeek: 2000, // $20.00 in cents
    interval: '15 minutes',
    checksPerDay: 96,
  },
} as const;

export type TierId = keyof typeof TIER_CONFIG;

/**
 * Calculate the total price for a tier purchase
 */
export function calculatePrice(tierId: TierId, weeks: number): number {
  const tierConfig = TIER_CONFIG[tierId];
  if (!tierConfig) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }

  return tierConfig.pricePerWeek * weeks;
}

/**
 * Format price in cents to display format ($X.XX)
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate expiry date from start date and weeks
 */
export function calculateExpiryDate(startDate: Date, weeks: number): Date {
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + weeks * 7);
  return expiryDate;
}

/**
 * Check if a tier requires payment
 */
export function requiresPayment(tierId: TierId): boolean {
  return TIER_CONFIG[tierId].pricePerWeek > 0;
}

/**
 * Get discount percentage based on monthly packs
 * - 1 month (4 weeks): 0%
 * - 2 months (8 weeks): 10%
 * - 3 months (12 weeks): 20%
 */
export function getDiscountPercent(weeks: number): number {
  if (weeks >= 12) return 20;
  if (weeks >= 8) return 10;
  return 0;
}

/**
 * Calculate price with tiered discount
 */
export function calculatePriceWithDiscount(
  pricePerWeekCents: number,
  weeks: number
): { subtotal: number; discount: number; total: number; discountPercent: number } {
  const subtotal = pricePerWeekCents * weeks;
  const discountPercent = getDiscountPercent(weeks);
  const discount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discount;
  return { subtotal, discount, total, discountPercent };
}

/**
 * Get tier configuration
 */
export function getTierConfig(tierId: TierId) {
  const config = TIER_CONFIG[tierId];
  if (!config) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }
  return config;
}
