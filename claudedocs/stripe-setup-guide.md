# Stripe Setup Guide

## Overview

This app syncs payment tiers TO Stripe from the database. The database (`TIER_CONFIG` in `lib/stripe-config.ts`) is the single source of truth. The sync script automatically creates/updates Stripe products and prices.

## Setup Steps

### 1. Configure Tiers in Code

Edit `lib/stripe-config.ts` and update the `TIER_CONFIG` object:

```typescript
export const TIER_CONFIG = {
  '1hour': {
    id: '1hour',
    name: 'Hourly Checks (Free)',
    pricePerWeek: 0, // Free tier
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
}
```

### 2. Run Sync Script

Sync your tiers to Stripe and database:

```bash
npm run stripe:sync
```

Expected output:
```
🔄 Syncing payment tiers TO Stripe...

📦 Processing: Hourly Checks (Free) (1hour)
  ⏭️  Skipping free tier
  ✓ Added free tier to database

📦 Processing: Hourly Checks + SMS (1hour-sms)
  ✓ Created Stripe product: prod_XXX
  ✓ Created new price: price_XXX ($5)
  ✓ Created database record

📦 Processing: 30-Minute Checks (30min)
  ✓ Created Stripe product: prod_XXX
  ✓ Created new price: price_XXX ($15)
  ✓ Created database record

📦 Processing: 15-Minute Checks (Premium) (15min)
  ✓ Created Stripe product: prod_XXX
  ✓ Created new price: price_XXX ($20)
  ✓ Created database record

✅ Sync complete!
```

### 3. Verify

**Check Database:**
```sql
SELECT id, name, price_per_week, stripe_price_id FROM payment_tiers;
```

**Check Stripe:**
Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products) and you'll see your 3 products with proper metadata automatically set.

## Important Notes

### Database is Source of Truth
- All pricing is defined in `lib/stripe-config.ts`
- Stripe products are automatically created/updated from code
- Metadata is automatically set by the sync script
- No manual Stripe product creation needed!

### Price Format
- Define prices in **cents** in `TIER_CONFIG` (e.g., 500 = $5.00)
- The database `price_per_week` column stores in cents
- Frontend displays as dollars using `/ 100`

### Updating Prices
To change pricing:

1. Edit `lib/stripe-config.ts`:
   ```typescript
   '30min': {
     pricePerWeek: 1200, // Changed from $15 to $12
   }
   ```

2. Run sync:
   ```bash
   npm run stripe:sync
   ```

3. The script will:
   - Deactivate old $15 price in Stripe
   - Create new $12 price
   - Update database with new price ID

### Adding New Tiers
1. Add to `TIER_CONFIG` in `lib/stripe-config.ts`
2. Run `npm run stripe:sync`
3. New Stripe product and database record automatically created

### Metadata
The sync script automatically sets these metadata fields on Stripe products:
- `tier_id` - Unique identifier (e.g., "1hour-sms", "30min", "15min")
- `check_interval` - Display text (e.g., "1 hour", "30 minutes")
- `checks_per_day` - Number of checks (e.g., "24", "48", "96")

## Troubleshooting

### Foreign key errors in checkout
- Run `npm run stripe:sync` to populate the `payment_tiers` table
- Verify tier_id values in `TIER_CONFIG` match what your frontend uses

### Price not updating in checkout
- Run `npm run stripe:sync` after changing prices
- Check that `stripePriceId` is updated in database
- Restart your dev server to pick up changes
