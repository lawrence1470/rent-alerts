/**
 * Rent Stabilization Enrichment Service
 *
 * Enriches listings with rent stabilization status using NYC PLUTO data
 * Processes listings in batches for performance optimization
 */

import { db } from '../db';
import { listings, type Listing } from '../schema';
import { eq, inArray, isNull, or } from 'drizzle-orm';
import { getRentStabilizationStatus } from './pluto-api.service';

// Process listings in batches to avoid overwhelming the API
const BATCH_SIZE = 5;
const ENRICHMENT_TIMEOUT = 5000; // 5 seconds per listing
const CACHE_VALID_DAYS = 30; // Re-check after 30 days

export interface EnrichmentResult {
  listingId: string;
  success: boolean;
  status?: 'confirmed' | 'probable' | 'unlikely' | 'unknown';
  probability?: number;
  source?: string;
  error?: string;
}

export interface EnrichmentMetrics {
  listingsProcessed: number;
  successCount: number;
  failureCount: number;
  cacheHitCount: number;
  avgLatency: number;
  timeoutCount: number;
}

/**
 * Enrich multiple listings with rent stabilization data
 */
export async function enrichListingsWithRentStabilization(
  listingIds: string[]
): Promise<EnrichmentMetrics> {
  const metrics: EnrichmentMetrics = {
    listingsProcessed: 0,
    successCount: 0,
    failureCount: 0,
    cacheHitCount: 0,
    avgLatency: 0,
    timeoutCount: 0,
  };

  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
    const batch = listingIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(id => enrichSingleListing(id))
    );

    // Update metrics
    for (const result of batchResults) {
      metrics.listingsProcessed++;
      if (result.status === 'fulfilled' && result.value.success) {
        metrics.successCount++;
      } else {
        metrics.failureCount++;
        if (result.status === 'rejected' && result.reason?.includes('timeout')) {
          metrics.timeoutCount++;
        }
      }
    }
  }

  metrics.avgLatency = (Date.now() - startTime) / metrics.listingsProcessed;

  return metrics;
}

/**
 * Enrich a single listing with rent stabilization data
 */
async function enrichSingleListing(listingId: string): Promise<EnrichmentResult> {
  try {
    // Get listing details
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return {
        listingId,
        success: false,
        error: 'Listing not found',
      };
    }

    // Check if already enriched recently
    if (listing.rentStabilizedCheckedAt) {
      const daysSinceCheck = Math.floor(
        (Date.now() - new Date(listing.rentStabilizedCheckedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCheck < CACHE_VALID_DAYS) {
        return {
          listingId,
          success: true,
          status: listing.rentStabilizedStatus as any,
          probability: listing.rentStabilizedProbability || undefined,
          source: 'cached',
        };
      }
    }

    // Check if we have lat/lng
    if (!listing.latitude || !listing.longitude) {
      return {
        listingId,
        success: false,
        error: 'No location data available',
      };
    }

    // Get rent stabilization status with timeout
    const result = await Promise.race([
      getRentStabilizationStatus(listing.latitude, listing.longitude, listing.address),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ENRICHMENT_TIMEOUT)
      ),
    ]);

    // Update listing with enrichment data
    await db.update(listings)
      .set({
        rentStabilizedStatus: result.status,
        rentStabilizedProbability: result.probability,
        rentStabilizedSource: result.source === 'pluto_data' ? 'dhcr_registry' : result.source,
        rentStabilizedCheckedAt: new Date(),
        buildingDhcrId: result.building?.bbl || null,
      })
      .where(eq(listings.id, listingId));

    return {
      listingId,
      success: true,
      status: result.status,
      probability: result.probability,
      source: result.source,
    };
  } catch (error) {
    console.error(`Error enriching listing ${listingId}:`, error);
    return {
      listingId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get listings that need enrichment
 */
export async function getListingsNeedingEnrichment(limit: number = 100): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CACHE_VALID_DAYS);

  const needsEnrichment = await db.query.listings.findMany({
    where: or(
      isNull(listings.rentStabilizedCheckedAt),
      // Re-check listings older than cache validity period
      // Note: Direct date comparison might need adjustment based on your DB
    ),
    columns: {
      id: true,
    },
    limit,
  });

  return needsEnrichment.map(l => l.id);
}

/**
 * Check if a listing matches rent stabilization filter criteria
 */
export function listingMatchesRentStabilizedFilter(listing: Listing): boolean {
  // If status is confirmed, always include
  if (listing.rentStabilizedStatus === 'confirmed') {
    return true;
  }

  // If probable with high probability (>= 70%), include
  if (
    listing.rentStabilizedStatus === 'probable' &&
    listing.rentStabilizedProbability &&
    listing.rentStabilizedProbability >= 0.70
  ) {
    return true;
  }

  // Otherwise, exclude
  return false;
}

/**
 * Batch enrich listings for a specific neighborhood
 * Used for pre-warming cache for popular neighborhoods
 */
export async function warmCacheForNeighborhood(neighborhood: string): Promise<void> {
  const listingsToEnrich = await db.query.listings.findMany({
    where: eq(listings.neighborhood, neighborhood),
    columns: {
      id: true,
    },
    limit: 50,
  });

  if (listingsToEnrich.length > 0) {
    await enrichListingsWithRentStabilization(
      listingsToEnrich.map(l => l.id)
    );
  }
}

/**
 * Get enrichment statistics for monitoring
 */
export async function getEnrichmentStats(): Promise<{
  totalListings: number;
  enrichedListings: number;
  confirmedRentStabilized: number;
  probableRentStabilized: number;
  coveragePercentage: number;
}> {
  // This would need proper aggregation queries
  // For now, returning placeholder
  const allListings = await db.query.listings.findMany({
    columns: {
      rentStabilizedStatus: true,
      rentStabilizedCheckedAt: true,
    },
  });

  const enrichedListings = allListings.filter(l => l.rentStabilizedCheckedAt);
  const confirmedRS = allListings.filter(l => l.rentStabilizedStatus === 'confirmed');
  const probableRS = allListings.filter(l => l.rentStabilizedStatus === 'probable');

  return {
    totalListings: allListings.length,
    enrichedListings: enrichedListings.length,
    confirmedRentStabilized: confirmedRS.length,
    probableRentStabilized: probableRS.length,
    coveragePercentage: allListings.length > 0
      ? (enrichedListings.length / allListings.length) * 100
      : 0,
  };
}