/**
 * Firecrawl StreetEasy Service
 *
 * Scrapes StreetEasy listings using Firecrawl API.
 * Replaces the RapidAPI client with direct page scraping.
 */

import type { BatchCriteria } from './alert-batching.service';
import type { StreetEasyListing } from './streeteasy-api.service';
import { getValidSlugs, expandMetaAreas } from '../constants/streeteasy-areas';

// ============================================================================
// TYPES
// ============================================================================

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

interface ParsedListing {
  id: string;
  address: string;
  unit: string;
  price: number;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  url: string;
  imageUrl: string | null;
  noFee: boolean;
  netEffectiveRent: number | null;
}

// ============================================================================
// FIRECRAWL CLIENT
// ============================================================================

export class FirecrawlStreetEasyClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.firecrawl.dev/v1';
  private readonly streetEasyBase = 'https://streeteasy.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
  }

  /**
   * Build a StreetEasy search URL for a single neighborhood with filters
   */
  buildSearchUrl(slug: string, criteria: Partial<BatchCriteria>): string {
    let url = `${this.streetEasyBase}/for-rent/${slug}`;
    const filters: string[] = [];

    // Price filter
    if (criteria.minPrice || criteria.maxPrice) {
      const min = criteria.minPrice || '';
      const max = criteria.maxPrice || '';
      filters.push(`price:${min}-${max}`);
    }

    // Bedrooms filter
    if (criteria.minBeds !== undefined && criteria.minBeds !== null) {
      if (criteria.minBeds === 0) {
        filters.push('beds:0'); // Studios
      } else {
        filters.push(`beds>=${criteria.minBeds}`);
      }
    }
    if (criteria.maxBeds !== undefined && criteria.maxBeds !== null) {
      filters.push(`beds<=${criteria.maxBeds}`);
    }

    // Bathrooms filter
    if (criteria.minBaths !== undefined && criteria.minBaths !== null) {
      filters.push(`baths>=${criteria.minBaths}`);
    }

    // No fee filter
    if (criteria.noFee) {
      filters.push('no_fee:1');
    }

    // Build URL with filters
    if (filters.length > 0) {
      url += `/${filters.join('|')}`;
    }

    // Sort by newest listings
    url += '?sort_by=listed_desc';

    return url;
  }

  /**
   * Scrape a single StreetEasy search page
   */
  async scrapeSearchPage(url: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data: FirecrawlScrapeResponse = await response.json();

    if (!data.success || !data.data?.markdown) {
      throw new Error(`Firecrawl scrape failed: ${data.error || 'No markdown content'}`);
    }

    return data.data.markdown;
  }

  /**
   * Parse listing data from markdown content
   */
  parseListingsFromMarkdown(markdown: string, neighborhood: string): ParsedListing[] {
    const listings: ParsedListing[] = [];

    // Extract listing blocks using URL patterns
    // Pattern: [Address #Unit](https://streeteasy.com/building/...)
    const listingPattern = /\[([^\]]+)\]\((https:\/\/streeteasy\.com\/building\/[^)]+)\)/g;
    const pricePattern = /\$([0-9,]+)\s*(?:base rent|\/month)?/g;
    const bedsPattern = /(\d+)\s*beds?|Studio/gi;
    const bathsPattern = /(\d+(?:\.\d+)?)\s*baths?/gi;
    const sqftPattern = /([0-9,]+)\s*ft²/gi;

    // Split markdown into listing sections
    const sections = markdown.split(/(?=- (?:Rental unit|Co-op|Condo|Other type) in)/);

    for (const section of sections) {
      if (!section.trim()) continue;

      // Extract URL and address
      const urlMatch = section.match(/\[([^\]]+)\]\((https:\/\/streeteasy\.com\/building\/[^?)]+[^)]*)\)/);
      if (!urlMatch) continue;

      const addressWithUnit = urlMatch[1];
      const listingUrl = urlMatch[2].split('?')[0]; // Remove query params

      // Extract listing ID from URL
      const idMatch = listingUrl.match(/\/building\/([^/]+)\/([^/?]+)/);
      if (!idMatch) continue;

      const buildingSlug = idMatch[1];
      const unit = idMatch[2];
      const listingId = `${buildingSlug}-${unit}`;

      // Extract price - look for the base rent price
      const priceMatch = section.match(/\$([0-9,]+)\s*\n?\s*base rent/i);
      if (!priceMatch) continue;
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);

      // Extract net effective rent if available
      let netEffectiveRent: number | null = null;
      const netEffectiveMatch = section.match(/\$([0-9,]+)\s*net effective/i);
      if (netEffectiveMatch) {
        netEffectiveRent = parseInt(netEffectiveMatch[1].replace(/,/g, ''), 10);
      }

      // Extract bedrooms
      let bedrooms = 0;
      if (/Studio/i.test(section)) {
        bedrooms = 0;
      } else {
        const bedsMatch = section.match(/(\d+)\s*beds?/i);
        if (bedsMatch) {
          bedrooms = parseInt(bedsMatch[1], 10);
        }
      }

      // Extract bathrooms
      let bathrooms = 1;
      const bathsMatch = section.match(/(\d+(?:\.\d+)?)\s*baths?/i);
      if (bathsMatch) {
        bathrooms = parseFloat(bathsMatch[1]);
      }

      // Extract sqft
      let sqft: number | null = null;
      const sqftMatch = section.match(/([0-9,]+)\s*ft²/i);
      if (sqftMatch) {
        sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      }

      // Extract neighborhood from section header
      const neighborhoodMatch = section.match(/(?:Rental unit|Co-op|Condo|Other type) in ([^\n]+)/i);
      const listingNeighborhood = neighborhoodMatch
        ? neighborhoodMatch[1].trim()
        : neighborhood;

      // Extract first image URL
      let imageUrl: string | null = null;
      const imageMatch = section.match(/!\[[^\]]*\]\((https:\/\/photos\.zillowstatic\.com\/[^)]+)\)/);
      if (imageMatch) {
        imageUrl = imageMatch[1];
      }

      // Check for no fee indicator
      const noFee = /no fee|no broker fee/i.test(section);

      listings.push({
        id: listingId,
        address: addressWithUnit.replace(/\s*#\s*\w+$/, '').trim(),
        unit,
        price,
        neighborhood: listingNeighborhood,
        bedrooms,
        bathrooms,
        sqft,
        url: listingUrl,
        imageUrl,
        noFee,
        netEffectiveRent,
      });
    }

    return listings;
  }

  /**
   * Convert parsed listings to StreetEasyListing format
   */
  toStreetEasyListings(parsed: ParsedListing[]): StreetEasyListing[] {
    return parsed.map((listing) => ({
      id: listing.id,
      price: listing.price,
      longitude: 0, // Will be enriched later from geocoding
      latitude: 0, // Will be enriched later from geocoding
      url: listing.url,
      listingUrl: listing.url,
      title: `${listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR`} in ${listing.neighborhood}`,
      address: listing.address,
      neighborhood: listing.neighborhood,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft ?? undefined,
      noFee: listing.noFee,
      imageUrl: listing.imageUrl ?? undefined,
    }));
  }

  /**
   * Scrape listings for a single area with criteria
   */
  async scrapeArea(
    areaSlug: string,
    criteria: Partial<BatchCriteria>
  ): Promise<StreetEasyListing[]> {
    const url = this.buildSearchUrl(areaSlug, criteria);
    console.log(`[Firecrawl] Scraping: ${url}`);

    try {
      const markdown = await this.scrapeSearchPage(url);
      const parsed = this.parseListingsFromMarkdown(markdown, areaSlug);
      console.log(`[Firecrawl] Found ${parsed.length} listings in ${areaSlug}`);
      return this.toStreetEasyListings(parsed);
    } catch (error) {
      console.error(`[Firecrawl] Error scraping ${areaSlug}:`, error);
      return [];
    }
  }

  /**
   * Fetch listings for a batch criteria (main entry point)
   * Scrapes each area individually and combines results
   */
  async fetchBatch(criteria: BatchCriteria): Promise<StreetEasyListing[]> {
    // Get all area slugs from the criteria
    const rawSlugs = getValidSlugs(criteria.areas);

    // Expand any meta-areas (e.g., "all-downtown" -> individual neighborhoods)
    const areaSlugs = expandMetaAreas(rawSlugs);

    if (areaSlugs.length === 0) {
      console.warn('[Firecrawl] No valid area slugs found in criteria:', criteria.areas);
      return [];
    }

    console.log(`[Firecrawl] Fetching ${areaSlugs.length} areas:`, areaSlugs.join(', '));

    // Scrape each area with a small delay to avoid rate limiting
    const allListings: StreetEasyListing[] = [];
    const seenIds = new Set<string>();

    for (const slug of areaSlugs) {
      const listings = await this.scrapeArea(slug, criteria);

      // Deduplicate by listing ID
      for (const listing of listings) {
        if (!seenIds.has(listing.id)) {
          seenIds.add(listing.id);
          allListings.push(listing);
        }
      }

      // Small delay between requests (500ms)
      if (areaSlugs.indexOf(slug) < areaSlugs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`[Firecrawl] Total unique listings: ${allListings.length}`);
    return allListings;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let firecrawlClientInstance: FirecrawlStreetEasyClient | null = null;

export function getFirecrawlClient(): FirecrawlStreetEasyClient {
  if (!firecrawlClientInstance) {
    firecrawlClientInstance = new FirecrawlStreetEasyClient();
  }
  return firecrawlClientInstance;
}

// For testing - reset the singleton
export function resetFirecrawlClient(): void {
  firecrawlClientInstance = null;
}
