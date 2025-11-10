/**
 * Database Schema for Rental Notification System
 *
 * Design Principles:
 * 1. Cost-efficient batching: Group similar alerts to minimize API calls
 * 2. Deduplication: Track seen listings per user
 * 3. Serverless-optimized: Fast queries, no long-running processes
 * 4. Type-safe: Full TypeScript integration
 */

import { pgTable, text, timestamp, integer, boolean, uuid, uniqueIndex, index, jsonb, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USER ALERTS TABLE
// ============================================================================
// Stores user search criteria for rental notifications
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(), // User-friendly name for the alert

  // Search Criteria (matches StreetEasy API parameters)
  areas: text('areas').notNull(), // comma-separated neighborhoods (e.g., "east-village,west-village")
  minPrice: integer('min_price'), // null means no minimum
  maxPrice: integer('max_price'), // null means no maximum
  minBeds: integer('min_beds'),
  maxBeds: integer('max_beds'),
  minBaths: integer('min_baths'),
  noFee: boolean('no_fee').default(false),
  filterRentStabilized: boolean('filter_rent_stabilized').default(false),

  // Notification Preferences
  enablePhoneNotifications: boolean('enable_phone_notifications').default(true).notNull(),
  enableEmailNotifications: boolean('enable_email_notifications').default(true).notNull(),

  // Frequency Preference (which paid tier to use for this alert)
  preferredFrequency: text('preferred_frequency').default('1hour').notNull(), // '15min', '30min', '1hour', 'free'

  // Alert Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastChecked: timestamp('last_checked'), // null if never checked
}, (table) => ({
  // Index for efficient querying of active alerts
  userIdIdx: index('alerts_user_id_idx').on(table.userId),
  isActiveIdx: index('alerts_is_active_idx').on(table.isActive),
  lastCheckedIdx: index('alerts_last_checked_idx').on(table.lastChecked),
  // Composite index for batching queries
  batchingIdx: index('alerts_batching_idx').on(
    table.isActive,
    table.areas,
    table.minPrice,
    table.maxPrice,
    table.minBeds,
    table.maxBeds
  ),
}));

// ============================================================================
// ALERT BATCHES TABLE
// ============================================================================
// Represents grouped alerts that can be fetched with a single API call
// This is the key to cost optimization
export const alertBatches = pgTable('alert_batches', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Batch Criteria (broadest parameters that cover all alerts in this batch)
  areas: text('areas').notNull(), // Areas to search
  minPrice: integer('min_price'), // Minimum price across all alerts in batch
  maxPrice: integer('max_price'), // Maximum price across all alerts in batch
  minBeds: integer('min_beds'), // Minimum beds
  maxBeds: integer('max_beds'), // Maximum beds
  minBaths: integer('min_baths'), // Minimum baths
  noFee: boolean('no_fee'),

  // Batch Metadata
  alertCount: integer('alert_count').default(0).notNull(), // Number of alerts in this batch

  // Batch Hash (for quick lookup of identical batches)
  // Hash of sorted JSON of criteria - enables deduplication
  criteriaHash: text('criteria_hash').notNull().unique(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastFetched: timestamp('last_fetched'), // When we last called StreetEasy API for this batch
}, (table) => ({
  criteriaHashIdx: uniqueIndex('alert_batches_criteria_hash_idx').on(table.criteriaHash),
  lastFetchedIdx: index('alert_batches_last_fetched_idx').on(table.lastFetched),
}));

// ============================================================================
// ALERT BATCH MEMBERSHIPS TABLE
// ============================================================================
// Many-to-many relationship between alerts and batches
export const alertBatchMemberships = pgTable('alert_batch_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').notNull().references(() => alertBatches.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  alertIdIdx: index('alert_batch_memberships_alert_id_idx').on(table.alertId),
  batchIdIdx: index('alert_batch_memberships_batch_id_idx').on(table.batchId),
  // Prevent duplicate memberships
  uniqueMembership: uniqueIndex('alert_batch_memberships_unique').on(table.alertId, table.batchId),
}));

// ============================================================================
// LISTINGS TABLE
// ============================================================================
// Stores listings fetched from StreetEasy API
export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // StreetEasy Data
  streetEasyId: text('street_easy_id').notNull().unique(), // Listing ID from API
  title: text('title').notNull(),
  address: text('address').notNull(),
  neighborhood: text('neighborhood').notNull(),

  // Details
  price: integer('price').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  sqft: integer('sqft'),
  noFee: boolean('no_fee').default(false),

  // URLs
  listingUrl: text('listing_url').notNull(),
  imageUrl: text('image_url'),

  // Location (for rent stabilization matching)
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Rent Stabilization Data
  rentStabilizedStatus: text('rent_stabilized_status').default('unknown'), // 'confirmed', 'probable', 'unlikely', 'unknown'
  rentStabilizedProbability: real('rent_stabilized_probability'), // 0.0 to 1.0
  rentStabilizedSource: text('rent_stabilized_source'), // 'dhcr_registry', 'heuristic', 'manual_verification'
  rentStabilizedCheckedAt: timestamp('rent_stabilized_checked_at'),
  buildingDhcrId: text('building_dhcr_id'), // DHCR building ID if found

  // Raw Data (store full API response for future reference)
  rawData: jsonb('raw_data'),

  // Metadata
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(), // false if listing removed from StreetEasy
}, (table) => ({
  streetEasyIdIdx: uniqueIndex('listings_street_easy_id_idx').on(table.streetEasyId),
  neighborhoodIdx: index('listings_neighborhood_idx').on(table.neighborhood),
  priceIdx: index('listings_price_idx').on(table.price),
  firstSeenAtIdx: index('listings_first_seen_at_idx').on(table.firstSeenAt),
  buildingDhcrIdIdx: index('listings_building_dhcr_id_idx').on(table.buildingDhcrId),
  rentStabilizedStatusIdx: index('listings_rent_stabilized_status_idx').on(table.rentStabilizedStatus),
  isActiveIdx: index('listings_is_active_idx').on(table.isActive),
}));

// ============================================================================
// USER SEEN LISTINGS TABLE
// ============================================================================
// Tracks which listings each user has already been notified about
// Critical for deduplication
export const userSeenListings = pgTable('user_seen_listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }), // Which alert matched this listing

  // Metadata
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_seen_listings_user_id_idx').on(table.userId),
  listingIdIdx: index('user_seen_listings_listing_id_idx').on(table.listingId),
  alertIdIdx: index('user_seen_listings_alert_id_idx').on(table.alertId),
  // Prevent duplicate entries
  uniqueSeen: uniqueIndex('user_seen_listings_unique').on(table.userId, table.listingId, table.alertId),
}));

// ============================================================================
// NOTIFICATIONS TABLE
// ============================================================================
// Queue of notifications to be sent to users
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),

  // Notification Channel - UPDATED to include 'sms'
  channel: text('channel', { enum: ['email', 'in_app', 'push', 'sms'] }).notNull().default('in_app'),

  // Status
  status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),

  // Message (pre-generated for efficiency)
  subject: text('subject'),
  body: text('body'),

  // SMS specific fields
  phoneNumber: text('phone_number'), // E.164 format phone number for SMS
  twilioMessageSid: text('twilio_message_sid'), // Twilio message identifier

  // Email specific fields
  emailAddress: text('email_address'), // Email address for email notifications
  resendMessageId: text('resend_message_id'), // Resend message identifier

  // Error tracking
  errorMessage: text('error_message'),
  attemptCount: integer('attempt_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  alertIdIdx: index('notifications_alert_id_idx').on(table.alertId),
  statusIdx: index('notifications_status_idx').on(table.status),
  channelIdx: index('notifications_channel_idx').on(table.channel),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  // Query pending notifications efficiently
  pendingNotificationsIdx: index('notifications_pending_idx').on(table.status, table.channel, table.createdAt),
}));

// ============================================================================
// CRON JOB LOGS TABLE
// ============================================================================
// Tracks cron job executions for monitoring and debugging
export const cronJobLogs = pgTable('cron_job_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobName: text('job_name').notNull(), // e.g., "check-alerts"

  // Execution details
  status: text('status', { enum: ['started', 'completed', 'failed'] }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds

  // Metrics
  alertsProcessed: integer('alerts_processed').default(0),
  batchesFetched: integer('batches_fetched').default(0),
  newListingsFound: integer('new_listings_found').default(0),
  notificationsCreated: integer('notifications_created').default(0),

  // Error tracking
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
}, (table) => ({
  jobNameIdx: index('cron_job_logs_job_name_idx').on(table.jobName),
  startedAtIdx: index('cron_job_logs_started_at_idx').on(table.startedAt),
  statusIdx: index('cron_job_logs_status_idx').on(table.status),
}));

// ============================================================================
// BUILDING CACHE TABLE
// ============================================================================
// Cache building-level rent stabilization data to minimize API calls
export const buildingCache = pgTable('building_cache', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Building identification (normalized)
  addressNormalized: text('address_normalized').notNull(), // Normalized address for matching
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),

  // DHCR data
  dhcrBuildingId: text('dhcr_building_id'),
  dhcrLastUpdated: timestamp('dhcr_last_updated'),
  isRentStabilized: boolean('is_rent_stabilized').notNull(),
  stabilizedUnitCount: integer('stabilized_unit_count'),
  totalUnitCount: integer('total_unit_count'),

  // Heuristic data
  heuristicProbability: real('heuristic_probability'),
  buildingYearBuilt: integer('building_year_built'),

  // Cache metadata
  cacheHitCount: integer('cache_hit_count').default(0),
  lastQueriedAt: timestamp('last_queried_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite index for geospatial lookups
  locationIdx: index('building_cache_location_idx').on(table.latitude, table.longitude),
  addressIdx: index('building_cache_address_idx').on(table.addressNormalized),
  dhcrIdIdx: index('building_cache_dhcr_id_idx').on(table.dhcrBuildingId),
}));

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================
export const alertsRelations = relations(alerts, ({ many }) => ({
  batchMemberships: many(alertBatchMemberships),
  seenListings: many(userSeenListings),
  notifications: many(notifications),
}));

export const alertBatchesRelations = relations(alertBatches, ({ many }) => ({
  memberships: many(alertBatchMemberships),
}));

export const alertBatchMembershipsRelations = relations(alertBatchMemberships, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertBatchMemberships.alertId],
    references: [alerts.id],
  }),
  batch: one(alertBatches, {
    fields: [alertBatchMemberships.batchId],
    references: [alertBatches.id],
  }),
}));

export const listingsRelations = relations(listings, ({ many }) => ({
  seenBy: many(userSeenListings),
  notifications: many(notifications),
}));

export const userSeenListingsRelations = relations(userSeenListings, ({ one }) => ({
  listing: one(listings, {
    fields: [userSeenListings.listingId],
    references: [listings.id],
  }),
  alert: one(alerts, {
    fields: [userSeenListings.alertId],
    references: [alerts.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  alert: one(alerts, {
    fields: [notifications.alertId],
    references: [alerts.id],
  }),
  listing: one(listings, {
    fields: [notifications.listingId],
    references: [listings.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type AlertBatch = typeof alertBatches.$inferSelect;
export type NewAlertBatch = typeof alertBatches.$inferInsert;

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

export type UserSeenListing = typeof userSeenListings.$inferSelect;
export type NewUserSeenListing = typeof userSeenListings.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type CronJobLog = typeof cronJobLogs.$inferSelect;
export type NewCronJobLog = typeof cronJobLogs.$inferInsert;

export type BuildingCache = typeof buildingCache.$inferSelect;
export type NewBuildingCache = typeof buildingCache.$inferInsert;

// ============================================================================
// PAYMENT TIERS TABLE
// ============================================================================
// Defines the available notification frequency tiers and their pricing
export const paymentTiers = pgTable('payment_tiers', {
  id: text('id').primaryKey(), // '15min', '30min', '1hour'
  name: text('name').notNull(), // 'Premium (15-minute checks)', etc.
  checkInterval: text('check_interval').notNull(), // '15 minutes', '30 minutes', '1 hour'
  pricePerWeek: integer('price_per_week').notNull(), // Price in cents (e.g., 2000 = $20.00)
  checksPerDay: integer('checks_per_day').notNull(), // Number of checks per day
  stripePriceId: text('stripe_price_id'), // Stripe Price ID for this tier
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('payment_tiers_is_active_idx').on(table.isActive),
}));

// ============================================================================
// USER ACCESS PERIODS TABLE
// ============================================================================
// Tracks time-based access periods for each tier
export const userAccessPeriods = pgTable('user_access_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  tierId: text('tier_id').notNull().references(() => paymentTiers.id),

  // Access Period
  startsAt: timestamp('starts_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),

  // Status
  status: text('status', { enum: ['active', 'expired', 'refunded'] }).default('active').notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_access_periods_user_id_idx').on(table.userId),
  tierIdIdx: index('user_access_periods_tier_id_idx').on(table.tierId),
  statusIdx: index('user_access_periods_status_idx').on(table.status),
  expiresAtIdx: index('user_access_periods_expires_at_idx').on(table.expiresAt),
  // Composite index for efficient active period queries
  activePeriodsIdx: index('user_access_periods_active_idx').on(
    table.userId,
    table.status,
    table.expiresAt
  ),
}));

// ============================================================================
// PURCHASES TABLE
// ============================================================================
// Records of all payment transactions
export const purchases = pgTable('purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  tierId: text('tier_id').notNull().references(() => paymentTiers.id),

  // Stripe Data
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),

  // Purchase Details
  weeksPurchased: integer('weeks_purchased').notNull(),
  totalAmount: integer('total_amount').notNull(), // in cents

  // Linked Access Period
  accessPeriodId: uuid('access_period_id').references(() => userAccessPeriods.id),

  // Status
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).default('pending').notNull(),

  // Metadata
  metadata: jsonb('metadata'), // Store additional Stripe metadata

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userIdIdx: index('purchases_user_id_idx').on(table.userId),
  tierIdIdx: index('purchases_tier_id_idx').on(table.tierId),
  statusIdx: index('purchases_status_idx').on(table.status),
  stripePaymentIntentIdx: uniqueIndex('purchases_stripe_payment_intent_idx').on(table.stripePaymentIntentId),
  stripeCheckoutSessionIdx: uniqueIndex('purchases_stripe_checkout_session_idx').on(table.stripeCheckoutSessionId),
}));

// ============================================================================
// PAYMENT RELATIONS
// ============================================================================
export const paymentTiersRelations = relations(paymentTiers, ({ many }) => ({
  accessPeriods: many(userAccessPeriods),
  purchases: many(purchases),
}));

export const userAccessPeriodsRelations = relations(userAccessPeriods, ({ one, many }) => ({
  tier: one(paymentTiers, {
    fields: [userAccessPeriods.tierId],
    references: [paymentTiers.id],
  }),
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  tier: one(paymentTiers, {
    fields: [purchases.tierId],
    references: [paymentTiers.id],
  }),
  accessPeriod: one(userAccessPeriods, {
    fields: [purchases.accessPeriodId],
    references: [userAccessPeriods.id],
  }),
}));

// ============================================================================
// PAYMENT TYPE EXPORTS
// ============================================================================
export type PaymentTier = typeof paymentTiers.$inferSelect;
export type NewPaymentTier = typeof paymentTiers.$inferInsert;

export type UserAccessPeriod = typeof userAccessPeriods.$inferSelect;
export type NewUserAccessPeriod = typeof userAccessPeriods.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
