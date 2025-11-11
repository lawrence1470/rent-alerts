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
  apiVersion: '2024-12-18.acacia',
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
 * Get tier configuration
 */
export function getTierConfig(tierId: TierId) {
  const config = TIER_CONFIG[tierId];
  if (!config) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }
  return config;
}
