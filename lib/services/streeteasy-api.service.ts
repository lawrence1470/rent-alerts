/**
 * StreetEasy API Service
 *
 * Handles all interactions with StreetEasy using Firecrawl for direct page scraping.
 * Replaces the previous RapidAPI implementation.
 */

import type { BatchCriteria } from './alert-batching.service';
import { FirecrawlStreetEasyClient, getFirecrawlClient } from './firecrawl-streeteasy.service';

// ============================================================================
// TYPES
// ============================================================================
export interface StreetEasyListing {
  id: string;
  price: number;
  longitude: number;
  latitude: number;
  url: string;
  title?: string;
  address?: string;
  neighborhood?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  noFee?: boolean;
  listingUrl: string;
  imageUrl?: string;
}

export interface StreetEasySearchParams {
  areas: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  noFee?: boolean;
  limit?: number;
  offset?: number;
}

export interface StreetEasySearchResponse {
  listings: StreetEasyListing[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// API CLIENT (Firecrawl-based)
// ============================================================================

export class StreetEasyApiClient {
  private readonly firecrawlClient: FirecrawlStreetEasyClient;

  constructor() {
    this.firecrawlClient = getFirecrawlClient();
  }

  /**
   * Searches for rentals using Firecrawl scraping
   */
  async searchRentals(params: StreetEasySearchParams): Promise<StreetEasySearchResponse> {
    // Convert params to BatchCriteria format
    const criteria: BatchCriteria = {
      areas: params.areas,
      minPrice: params.minPrice ?? null,
      maxPrice: params.maxPrice ?? null,
      minBeds: params.minBeds ?? null,
      maxBeds: params.maxBeds ?? null,
      minBaths: params.minBaths ?? null,
      noFee: params.noFee ?? false,
    };

    try {
      const listings = await this.firecrawlClient.fetchBatch(criteria);

      // Apply limit if specified
      const limit = params.limit || 100;
      const limitedListings = listings.slice(0, limit);

      return {
        listings: limitedListings,
        total: listings.length,
        hasMore: listings.length > limit,
      };
    } catch (error) {
      console.error('Error fetching from StreetEasy via Firecrawl:', error);
      throw error;
    }
  }

  /**
   * Fetches rentals for a batch criteria
   */
  async fetchBatch(criteria: BatchCriteria): Promise<StreetEasyListing[]> {
    return this.firecrawlClient.fetchBatch(criteria);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let apiClientInstance: StreetEasyApiClient | null = null;

export function getStreetEasyClient(): StreetEasyApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new StreetEasyApiClient();
  }
  return apiClientInstance;
}

// For testing - reset the singleton
export function resetStreetEasyClient(): void {
  apiClientInstance = null;
}
