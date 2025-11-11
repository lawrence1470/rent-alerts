/**
 * StreetEasy API Service
 *
 * Handles all interactions with the StreetEasy RapidAPI endpoint
 */

import type { BatchCriteria } from './alert-batching.service';

// ============================================================================
// TYPES
// ============================================================================
export interface StreetEasyListing {
  id: string;
  price: number;
  longitude: number;
  latitude: number;
  url: string;
  // These fields will be enriched from other sources or set to defaults
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

export interface StreetEasyApiResponse {
  pagination: {
    count: number;
    nextOffset?: number;
  };
  listings: Array<{
    id: string;
    price: number;
    longitude: number;
    latitude: number;
    url: string;
  }>;
}

export interface StreetEasySearchResponse {
  listings: StreetEasyListing[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// API CLIENT
// ============================================================================

export class StreetEasyApiClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://streeteasy-rentals.p.rapidapi.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RAPIDAPI_KEY || '';
    if (!this.apiKey) {
      throw new Error('RAPIDAPI_KEY environment variable is not set');
    }
  }

  /**
   * Searches for rentals using the StreetEasy API
   */
  async searchRentals(params: StreetEasySearchParams): Promise<StreetEasySearchResponse> {
    const url = new URL(`${this.baseUrl}/rentals/search`);

    // Add query parameters
    url.searchParams.append('areas', params.areas);

    if (params.minPrice !== undefined && params.minPrice !== null) {
      url.searchParams.append('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      url.searchParams.append('maxPrice', params.maxPrice.toString());
    }
    if (params.minBeds !== undefined && params.minBeds !== null) {
      url.searchParams.append('minBeds', params.minBeds.toString());
    }
    if (params.maxBeds !== undefined && params.maxBeds !== null) {
      url.searchParams.append('maxBeds', params.maxBeds.toString());
    }
    if (params.minBaths !== undefined && params.minBaths !== null) {
      url.searchParams.append('minBaths', params.minBaths.toString());
    }
    if (params.noFee !== undefined) {
      url.searchParams.append('noFee', params.noFee.toString());
    }

    const limit = params.limit || 100; // Default to 100 results
    url.searchParams.append('limit', limit.toString());

    if (params.offset) {
      url.searchParams.append('offset', params.offset.toString());
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'streeteasy-rentals.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        throw new Error(`StreetEasy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to our format
      return this.transformResponse(data);
    } catch (error) {
      console.error('Error fetching from StreetEasy API:', error);
      throw error;
    }
  }

  /**
   * Fetches rentals for a batch criteria
   */
  async fetchBatch(criteria: BatchCriteria): Promise<StreetEasyListing[]> {
    const params: StreetEasySearchParams = {
      areas: criteria.areas,
      minPrice: criteria.minPrice ?? undefined,
      maxPrice: criteria.maxPrice ?? undefined,
      minBeds: criteria.minBeds ?? undefined,
      maxBeds: criteria.maxBeds ?? undefined,
      minBaths: criteria.minBaths ?? undefined,
      noFee: criteria.noFee,
      limit: 100, // Fetch up to 100 listings per batch
    };

    const response = await this.searchRentals(params);
    return response.listings;
  }

  /**
   * Transforms the actual StreetEasy API response to our internal format
   * Based on the actual API response: {id, price, longitude, latitude, url}
   */
  private transformResponse(data: StreetEasyApiResponse): StreetEasySearchResponse {
    const listings: StreetEasyListing[] = data.listings.map((item) => ({
      id: item.id,
      price: item.price,
      longitude: item.longitude,
      latitude: item.latitude,
      url: item.url,
      listingUrl: item.url, // Use the same URL for listingUrl

      // These fields are not in the API response but are needed for the database
      // They can be enriched later or set to defaults
      title: `Listing ${item.id}`, // Placeholder title
      address: '', // Will be enriched from PLUTO data or scraping
      neighborhood: '', // Will be determined from coordinates
      bedrooms: 0, // Will need to be scraped or use defaults
      bathrooms: 0, // Will need to be scraped or use defaults
      noFee: false, // Conservative default, can be updated
    }));

    return {
      listings,
      total: data.pagination.count,
      hasMore: data.pagination.nextOffset !== undefined,
    };
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
