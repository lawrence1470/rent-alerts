/**
 * Listing Deduplication Service
 *
 * Handles tracking which listings users have already seen
 * Prevents duplicate notifications
 */

import { db } from '../db';
import { listings, userSeenListings, type Alert, type Listing } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { StreetEasyListing } from './streeteasy-api.service';

// ============================================================================
// LISTING PERSISTENCE
// ============================================================================

/**
 * Upserts listings from StreetEasy API into database
 * Returns array of listing database IDs
 */
export async function upsertListings(apiListings: StreetEasyListing[]): Promise<Listing[]> {
  if (apiListings.length === 0) return [];

  const upsertedListings: Listing[] = [];

  for (const apiListing of apiListings) {
    // Check if listing already exists
    const existing = await db.query.listings.findFirst({
      where: eq(listings.streetEasyId, apiListing.id),
    });

    if (existing) {
      // Update existing listing
      const [updated] = await db.update(listings)
        .set({
          title: apiListing.title || existing.title,
          address: apiListing.address || existing.address,
          neighborhood: apiListing.neighborhood || existing.neighborhood,
          price: apiListing.price,
          latitude: apiListing.latitude,
          longitude: apiListing.longitude,
          bedrooms: apiListing.bedrooms || existing.bedrooms,
          bathrooms: apiListing.bathrooms || existing.bathrooms,
          sqft: apiListing.sqft || existing.sqft,
          noFee: apiListing.noFee || existing.noFee,
          listingUrl: apiListing.listingUrl,
          imageUrl: apiListing.imageUrl || existing.imageUrl,
          lastSeenAt: new Date(),
          isActive: true,
          rawData: apiListing as any,
        })
        .where(eq(listings.id, existing.id))
        .returning();

      upsertedListings.push(updated);
    } else {
      // Insert new listing
      const [inserted] = await db.insert(listings).values({
        streetEasyId: apiListing.id,
        title: apiListing.title || `Listing ${apiListing.id}`,
        address: apiListing.address || '',
        neighborhood: apiListing.neighborhood || '',
        price: apiListing.price,
        latitude: apiListing.latitude,
        longitude: apiListing.longitude,
        bedrooms: apiListing.bedrooms || 0,
        bathrooms: apiListing.bathrooms || 0,
        sqft: apiListing.sqft,
        noFee: apiListing.noFee || false,
        listingUrl: apiListing.listingUrl,
        imageUrl: apiListing.imageUrl,
        rawData: apiListing as any,
      }).returning();

      upsertedListings.push(inserted);
    }
  }

  return upsertedListings;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Gets all listing IDs that a user has already seen for a specific alert
 */
export async function getSeenListingIds(userId: string, alertId: string): Promise<Set<string>> {
  const seenRecords = await db.query.userSeenListings.findMany({
    where: and(
      eq(userSeenListings.userId, userId),
      eq(userSeenListings.alertId, alertId)
    ),
    columns: {
      listingId: true,
    },
  });

  return new Set(seenRecords.map(r => r.listingId));
}

/**
 * Gets all listing IDs that a user has seen across all alerts
 * More efficient for bulk operations
 */
export async function getAllSeenListingIds(userId: string): Promise<Set<string>> {
  const seenRecords = await db.query.userSeenListings.findMany({
    where: eq(userSeenListings.userId, userId),
    columns: {
      listingId: true,
    },
  });

  return new Set(seenRecords.map(r => r.listingId));
}

/**
 * Filters out listings that a user has already seen for a specific alert
 */
export async function filterNewListings(
  userId: string,
  alertId: string,
  listings: Listing[]
): Promise<Listing[]> {
  if (listings.length === 0) return [];

  const seenIds = await getSeenListingIds(userId, alertId);
  return listings.filter(listing => !seenIds.has(listing.id));
}

/**
 * Marks listings as seen by a user for a specific alert
 */
export async function markListingsAsSeen(
  userId: string,
  alertId: string,
  listingIds: string[]
): Promise<void> {
  if (listingIds.length === 0) return;

  const records = listingIds.map(listingId => ({
    userId,
    alertId,
    listingId,
  }));

  // Insert only if not exists (handled by unique constraint)
  await db.insert(userSeenListings)
    .values(records)
    .onConflictDoNothing();
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Processes listings for multiple users and alerts
 * Returns map of alertId -> userId -> new listings
 */
export async function batchFilterNewListings(
  alertUserMap: Map<string, string>, // alertId -> userId
  allListings: Listing[]
): Promise<Map<string, Map<string, Listing[]>>> {
  // Result structure: alertId -> userId -> listings
  const result = new Map<string, Map<string, Listing[]>>();

  // Get all unique user IDs
  const userIds = Array.from(new Set(alertUserMap.values()));

  // Batch fetch all seen listings for all users
  const userSeenMap = new Map<string, Set<string>>();
  for (const userId of userIds) {
    const seenIds = await getAllSeenListingIds(userId);
    userSeenMap.set(userId, seenIds);
  }

  // Filter listings for each alert-user combination
  for (const [alertId, userId] of alertUserMap) {
    const seenIds = userSeenMap.get(userId) || new Set();
    const newListings = allListings.filter(listing => !seenIds.has(listing.id));

    if (!result.has(alertId)) {
      result.set(alertId, new Map());
    }
    result.get(alertId)!.set(userId, newListings);
  }

  return result;
}

/**
 * Gets listings that were first seen within the last N hours
 * Useful for "recent listings" features
 */
export async function getRecentListings(hours: number = 24, limit: number = 50): Promise<Listing[]> {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const recentListings = await db.query.listings.findMany({
    where: and(
      eq(listings.isActive, true),
    ),
    orderBy: (listings, { desc }) => [desc(listings.firstSeenAt)],
    limit,
  });

  return recentListings.filter(l => l.firstSeenAt >= cutoffDate);
}

/**
 * Marks listings as inactive if they haven't been seen in recent API calls
 * Should be called periodically to clean up stale listings
 */
export async function markStaleListingsInactive(daysSinceLastSeen: number = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysSinceLastSeen * 24 * 60 * 60 * 1000);

  const result = await db.update(listings)
    .set({ isActive: false })
    .where(and(
      eq(listings.isActive, true),
    ))
    .returning();

  // Filter by lastSeenAt in application code (more reliable than SQL date comparison)
  const toUpdate = result.filter(l => l.lastSeenAt < cutoffDate);

  return toUpdate.length;
}
