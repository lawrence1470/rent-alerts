/**
 * Sync Payment Tiers TO Stripe
 *
 * Creates/updates Stripe products and prices based on TIER_CONFIG.
 * Database is the source of truth, Stripe is synced from it.
 *
 * Usage: npm run stripe:sync
 */

import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

async function syncToStripe() {
  console.log('🔄 Syncing payment tiers TO Stripe...\n');

  // Dynamic imports after env is loaded
  const { stripe } = await import('./stripe-config');
  const { TIER_CONFIG } = await import('./stripe-config');
  const { db } = await import('./db');
  const { paymentTiers } = await import('./schema');
  const { eq } = await import('drizzle-orm');

  try {
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const [tierId, config] of Object.entries(TIER_CONFIG)) {
      console.log(`\n📦 Processing: ${config.name} (${tierId})`);

      // Skip free tier (no Stripe product needed)
      if (config.pricePerWeek === 0) {
        console.log('  ⏭️  Skipping free tier');

        // Still add to database
        const existing = await db.query.paymentTiers.findFirst({
          where: (tiers, { eq }) => eq(tiers.id, tierId),
        });

        if (!existing) {
          await db.insert(paymentTiers).values({
            id: tierId,
            name: config.name,
            checkInterval: config.interval,
            pricePerWeek: 0,
            checksPerDay: config.checksPerDay,
            stripePriceId: null,
            isActive: true,
          });
          console.log('  ✓ Added free tier to database');
        }
        continue;
      }

      // Search for existing product by metadata.tier_id
      const existingProducts = await stripe.products.search({
        query: `metadata['tier_id']:'${tierId}'`,
      });

      let product;
      let productId;

      if (existingProducts.data.length > 0) {
        // Product exists - update it
        product = existingProducts.data[0];
        productId = product.id;

        await stripe.products.update(productId, {
          name: config.name,
          active: true,
          metadata: {
            tier_id: tierId,
            check_interval: config.interval,
            checks_per_day: config.checksPerDay.toString(),
          },
        });

        console.log(`  ✓ Updated Stripe product: ${productId}`);
      } else {
        // Create new product
        product = await stripe.products.create({
          name: config.name,
          active: true,
          metadata: {
            tier_id: tierId,
            check_interval: config.interval,
            checks_per_day: config.checksPerDay.toString(),
          },
        });

        productId = product.id;
        console.log(`  ✓ Created Stripe product: ${productId}`);
        createdCount++;
      }

      // Find or create price for this product
      const existingPrices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      let priceId;

      // Check if there's a price with the correct amount
      const matchingPrice = existingPrices.data.find(
        (p) => p.unit_amount === config.pricePerWeek
      );

      if (matchingPrice) {
        priceId = matchingPrice.id;
        console.log(`  ✓ Using existing price: ${priceId} ($${config.pricePerWeek / 100})`);
      } else {
        // Deactivate old prices if amount changed
        for (const oldPrice of existingPrices.data) {
          await stripe.prices.update(oldPrice.id, { active: false });
          console.log(`  ⚠️  Deactivated old price: ${oldPrice.id}`);
        }

        // Create new price
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: config.pricePerWeek,
          currency: 'usd',
          active: true,
        });

        priceId = newPrice.id;
        console.log(`  ✓ Created new price: ${priceId} ($${config.pricePerWeek / 100})`);
      }

      // Update database with Stripe IDs
      const existingTier = await db.query.paymentTiers.findFirst({
        where: (tiers, { eq }) => eq(tiers.id, tierId),
      });

      if (existingTier) {
        await db
          .update(paymentTiers)
          .set({
            name: config.name,
            checkInterval: config.interval,
            pricePerWeek: config.pricePerWeek,
            checksPerDay: config.checksPerDay,
            stripePriceId: priceId,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(paymentTiers.id, tierId));

        console.log(`  ✓ Updated database record`);
        updatedCount++;
      } else {
        await db.insert(paymentTiers).values({
          id: tierId,
          name: config.name,
          checkInterval: config.interval,
          pricePerWeek: config.pricePerWeek,
          checksPerDay: config.checksPerDay,
          stripePriceId: priceId,
          isActive: true,
        });

        console.log(`  ✓ Created database record`);
        createdCount++;
      }

      syncedCount++;
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   ${createdCount} created, ${updatedCount} updated, ${syncedCount} total synced`);
    console.log(`\n💡 Your database (TIER_CONFIG) is now the source of truth!`);
  } catch (error) {
    console.error('❌ Error syncing to Stripe:', error);
    process.exit(1);
  }

  process.exit(0);
}

syncToStripe();
