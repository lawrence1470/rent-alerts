/**
 * Alert Batching Service
 *
 * Core algorithm for grouping similar alerts to minimize API calls.
 * This is the key to cost optimization.
 *
 * Strategy:
 * 1. Group alerts by neighborhood combinations
 * 2. For each group, find the broadest search parameters
 * 3. Make one API call per group
 * 4. Filter results locally for each alert's specific criteria
 */

import { db } from '../db';
import { alerts, alertBatches, alertBatchMemberships, type Alert } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================
export interface BatchCriteria {
  areas: string;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  noFee: boolean;
}

export interface AlertBatch {
  batchId: string;
  criteria: BatchCriteria;
  alertIds: string[];
}

// ============================================================================
// CORE BATCHING ALGORITHM
// ============================================================================

/**
 * Groups alerts into batches that can be fetched with single API calls
 * Returns array of batches with their associated alert IDs
 */
export async function groupAlertsIntoBatches(activeAlerts: Alert[]): Promise<AlertBatch[]> {
  // Step 1: Group alerts by neighborhood combinations
  const areaGroups = new Map<string, Alert[]>();

  for (const alert of activeAlerts) {
    const normalizedAreas = normalizeAreas(alert.areas);
    if (!areaGroups.has(normalizedAreas)) {
      areaGroups.set(normalizedAreas, []);
    }
    areaGroups.get(normalizedAreas)!.push(alert);
  }

  // Step 2: For each area group, create batches with broadest criteria
  const batches: AlertBatch[] = [];

  for (const [areas, groupAlerts] of areaGroups) {
    // Find broadest parameters across all alerts in this area group
    const batchCriteria = calculateBroadestCriteria(groupAlerts);
    const criteriaHash = hashCriteria(batchCriteria);

    batches.push({
      batchId: criteriaHash,
      criteria: batchCriteria,
      alertIds: groupAlerts.map(a => a.id),
    });
  }

  return batches;
}

/**
 * Persists batch configuration to database
 * Updates existing batches or creates new ones
 */
export async function persistBatches(batches: AlertBatch[]): Promise<void> {
  for (const batch of batches) {
    // Check if batch already exists
    const existing = await db.query.alertBatches.findFirst({
      where: eq(alertBatches.criteriaHash, batch.batchId),
    });

    let batchDbId: string;

    if (existing) {
      // Update existing batch
      batchDbId = existing.id;
      await db.update(alertBatches)
        .set({
          alertCount: batch.alertIds.length,
        })
        .where(eq(alertBatches.id, existing.id));
    } else {
      // Create new batch
      const [newBatch] = await db.insert(alertBatches).values({
        areas: batch.criteria.areas,
        minPrice: batch.criteria.minPrice,
        maxPrice: batch.criteria.maxPrice,
        minBeds: batch.criteria.minBeds,
        maxBeds: batch.criteria.maxBeds,
        minBaths: batch.criteria.minBaths,
        noFee: batch.criteria.noFee,
        criteriaHash: batch.batchId,
        alertCount: batch.alertIds.length,
      }).returning();
      batchDbId = newBatch.id;
    }

    // Update batch memberships
    // Remove old memberships for these alerts
    await db.delete(alertBatchMemberships)
      .where(inArray(alertBatchMemberships.alertId, batch.alertIds));

    // Create new memberships
    const memberships = batch.alertIds.map(alertId => ({
      alertId,
      batchId: batchDbId,
    }));

    if (memberships.length > 0) {
      await db.insert(alertBatchMemberships).values(memberships);
    }
  }
}

/**
 * Retrieves all active alert batches from database
 */
export async function getActiveBatches(): Promise<Array<AlertBatch & { dbId: string }>> {
  const batchesWithAlerts = await db.query.alertBatches.findMany({
    with: {
      memberships: {
        with: {
          alert: true,
        },
        where: eq(alerts.isActive, true),
      },
    },
  });

  return batchesWithAlerts
    .filter(b => b.memberships.length > 0)
    .map(batch => ({
      dbId: batch.id,
      batchId: batch.criteriaHash,
      criteria: {
        areas: batch.areas,
        minPrice: batch.minPrice,
        maxPrice: batch.maxPrice,
        minBeds: batch.minBeds,
        maxBeds: batch.maxBeds,
        minBaths: batch.minBaths,
        noFee: batch.noFee ?? false,
      },
      alertIds: batch.memberships.map(m => m.alertId),
    }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes area strings for consistent grouping
 * Sorts areas alphabetically and lowercases
 */
function normalizeAreas(areas: string): string {
  return areas
    .split(',')
    .map(a => a.trim().toLowerCase())
    .sort()
    .join(',');
}

/**
 * Calculates the broadest search criteria that covers all alerts
 * Example: If alert A wants $2K-3K and alert B wants $2.5K-3.5K,
 * batch criteria should be $2K-3.5K (covers both)
 */
function calculateBroadestCriteria(alerts: Alert[]): BatchCriteria {
  const areas = normalizeAreas(alerts[0].areas);

  // Find minimum of all minPrice values (or null if any is null)
  const minPrice = alerts.reduce<number | null>((min, alert) => {
    if (alert.minPrice === null) return null; // No minimum constraint
    if (min === null) return alert.minPrice;
    return Math.min(min, alert.minPrice);
  }, alerts[0].minPrice);

  // Find maximum of all maxPrice values (or null if any is null)
  const maxPrice = alerts.reduce<number | null>((max, alert) => {
    if (alert.maxPrice === null) return null; // No maximum constraint
    if (max === null) return alert.maxPrice;
    return Math.max(max, alert.maxPrice);
  }, alerts[0].maxPrice);

  // Find minimum of all minBeds values
  const minBeds = alerts.reduce<number | null>((min, alert) => {
    if (alert.minBeds === null) return null;
    if (min === null) return alert.minBeds;
    return Math.min(min, alert.minBeds);
  }, alerts[0].minBeds);

  // Find maximum of all maxBeds values
  const maxBeds = alerts.reduce<number | null>((max, alert) => {
    if (alert.maxBeds === null) return null;
    if (max === null) return alert.maxBeds;
    return Math.max(max, alert.maxBeds);
  }, alerts[0].maxBeds);

  // Find minimum of all minBaths values
  const minBaths = alerts.reduce<number | null>((min, alert) => {
    if (alert.minBaths === null) return null;
    if (min === null) return alert.minBaths;
    return Math.min(min, alert.minBaths);
  }, alerts[0].minBaths);

  // noFee: if ANY alert wants noFee=false, we can't filter at API level
  // So we set to false (fetch all) and filter locally
  const noFee = alerts.every(a => a.noFee === true);

  return {
    areas,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    minBaths,
    noFee,
  };
}

/**
 * Creates a deterministic hash of batch criteria
 * Used to identify identical batches and prevent duplicates
 */
function hashCriteria(criteria: BatchCriteria): string {
  // Create sorted JSON string for consistent hashing
  const normalized = {
    areas: criteria.areas,
    maxBeds: criteria.maxBeds,
    maxPrice: criteria.maxPrice,
    minBaths: criteria.minBaths,
    minBeds: criteria.minBeds,
    minPrice: criteria.minPrice,
    noFee: criteria.noFee,
  };

  const json = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Checks if a listing matches an alert's criteria
 * Used for local filtering after batch fetch
 */
export function listingMatchesAlert(listing: any, alert: Alert): boolean {
  // Check price range
  if (alert.minPrice !== null && listing.price < alert.minPrice) {
    return false;
  }
  if (alert.maxPrice !== null && listing.price > alert.maxPrice) {
    return false;
  }

  // Check bedroom range
  if (alert.minBeds !== null && listing.bedrooms < alert.minBeds) {
    return false;
  }
  if (alert.maxBeds !== null && listing.bedrooms > alert.maxBeds) {
    return false;
  }

  // Check bathroom minimum
  if (alert.minBaths !== null && listing.bathrooms < alert.minBaths) {
    return false;
  }

  // Check no fee preference
  if (alert.noFee && !listing.noFee) {
    return false;
  }

  // Check rent stabilization filter
  if (alert.filterRentStabilized) {
    // Only include if confirmed or high probability
    const isRentStabilized =
      listing.rentStabilizedStatus === 'confirmed' ||
      (listing.rentStabilizedStatus === 'probable' &&
       listing.rentStabilizedProbability >= 0.70);

    if (!isRentStabilized) {
      return false;
    }
  }

  return true;
}

/**
 * Rebuilds all batches from scratch
 * Should be called when alerts are created/updated/deleted
 */
export async function rebuildAllBatches(): Promise<void> {
  // Get all active alerts
  const activeAlerts = await db.query.alerts.findMany({
    where: eq(alerts.isActive, true),
  });

  if (activeAlerts.length === 0) {
    // No active alerts, clear all batches
    await db.delete(alertBatchMemberships);
    await db.delete(alertBatches);
    return;
  }

  // Group into batches
  const batches = await groupAlertsIntoBatches(activeAlerts);

  // Persist to database
  await persistBatches(batches);
}
