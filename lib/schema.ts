/**
 * Database Schema for Rental Notification System
 *
 * Design Principles:
 * 1. Cost-efficient batching: Group similar alerts to minimize API calls
 * 2. Deduplication: Track seen listings per user
 * 3. Serverless-optimized: Fast queries, no long-running processes
 * 4. Type-safe: Full TypeScript integration
 */

import { pgTable, text, timestamp, integer, boolean, uuid, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
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

  // Notification Channel
  channel: text('channel', { enum: ['email', 'in_app', 'push'] }).notNull().default('in_app'),

  // Status
  status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),

  // Message (pre-generated for efficiency)
  subject: text('subject'),
  body: text('body'),

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
