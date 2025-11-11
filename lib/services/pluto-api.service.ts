/**
 * NYC PLUTO (Primary Land Use Tax Lot Output) API Service
 *
 * Uses NYC Open Data to determine rent stabilization likelihood
 * No API key required - public dataset
 *
 * Rent Stabilization Rules:
 * - Buildings with 6+ units built before 1974 are typically rent stabilized
 * - Some buildings built 1974-1984 may be rent stabilized if they received J-51 or 421-a tax benefits
 *
 * API Documentation: https://dev.socrata.com/foundry/data.cityofnewyork.us/64uk-42ks
 */

import { db } from '../db';
import { buildingCache } from '../schema';
import { eq, and } from 'drizzle-orm';

const PLUTO_ENDPOINT = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';

// Maximum distance in degrees for lat/lng matching (approximately 50 meters)
const LOCATION_TOLERANCE = 0.0005;

export interface PlutoBuilding {
  bbl: string;                    // Borough-Block-Lot identifier
  borough: string;                 // MN, BK, QN, BX, SI
  address: string;                 // Street address
  unitsres: string;                // Number of residential units
  yearbuilt: string;               // Year building was built
  bldgclass: string;               // Building class code
  latitude: string;                // Latitude
  longitude: string;               // Longitude
  zipcode: string;                 // ZIP code
  ownername?: string;              // Building owner
  numbldgs?: string;               // Number of buildings on lot
  numfloors?: string;              // Number of floors
  assessland?: string;             // Assessed land value
  assesstot?: string;              // Total assessed value
}

export interface RentStabilizationResult {
  status: 'confirmed' | 'probable' | 'unlikely' | 'unknown';
  probability: number;
  source: 'pluto_data' | 'heuristic' | 'no_data';
  building?: PlutoBuilding;
  reason?: string;
}

/**
 * Query PLUTO API by geographic coordinates
 */
export async function getPlutoBuildingByLocation(
  latitude: number,
  longitude: number
): Promise<PlutoBuilding | null> {
  try {
    // First check cache
    const cached = await checkBuildingCache(latitude, longitude);
    if (cached) {
      return cached.plutoData as PlutoBuilding | null;
    }

    // Query PLUTO API with location tolerance
    const minLat = latitude - LOCATION_TOLERANCE;
    const maxLat = latitude + LOCATION_TOLERANCE;
    const minLng = longitude - LOCATION_TOLERANCE;
    const maxLng = longitude + LOCATION_TOLERANCE;

    const query = new URLSearchParams({
      '$where': `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLng} AND longitude <= ${maxLng}`,
      '$limit': '10'
    });

    const response = await fetch(`${PLUTO_ENDPOINT}?${query}`);

    if (!response.ok) {
      console.error('PLUTO API error:', response.status, response.statusText);
      return null;
    }

    const buildings: PlutoBuilding[] = await response.json();

    if (buildings.length === 0) {
      return null;
    }

    // Find closest building
    let closestBuilding = buildings[0];
    let minDistance = calculateDistance(
      latitude,
      longitude,
      parseFloat(buildings[0].latitude),
      parseFloat(buildings[0].longitude)
    );

    for (const building of buildings.slice(1)) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(building.latitude),
        parseFloat(building.longitude)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestBuilding = building;
      }
    }

    // Cache the result
    await cacheBuildingData(closestBuilding, latitude, longitude);

    return closestBuilding;
  } catch (error) {
    console.error('Error fetching PLUTO data:', error);
    return null;
  }
}

/**
 * Query PLUTO API by BBL (Borough-Block-Lot)
 */
export async function getPlutoBuildingByBBL(bbl: string): Promise<PlutoBuilding | null> {
  try {
    const query = new URLSearchParams({ bbl });
    const response = await fetch(`${PLUTO_ENDPOINT}?${query}`);

    if (!response.ok) {
      console.error('PLUTO API error:', response.status, response.statusText);
      return null;
    }

    const buildings: PlutoBuilding[] = await response.json();
    return buildings[0] || null;
  } catch (error) {
    console.error('Error fetching PLUTO data by BBL:', error);
    return null;
  }
}

/**
 * Calculate rent stabilization probability based on PLUTO data
 */
export function calculateRentStabilizationProbability(building: PlutoBuilding): RentStabilizationResult {
  const unitsRes = parseInt(building.unitsres) || 0;
  const yearBuilt = parseInt(building.yearbuilt) || 0;

  // No residential units = not rent stabilized
  if (unitsRes === 0) {
    return {
      status: 'unlikely',
      probability: 0,
      source: 'pluto_data',
      building,
      reason: 'No residential units'
    };
  }

  // Less than 6 units = not eligible for rent stabilization
  if (unitsRes < 6) {
    return {
      status: 'unlikely',
      probability: 0.05,
      source: 'pluto_data',
      building,
      reason: `Only ${unitsRes} units (rent stabilization requires 6+)`
    };
  }

  // 6+ units built before 1974 = very likely rent stabilized
  if (unitsRes >= 6 && yearBuilt > 0 && yearBuilt < 1974) {
    return {
      status: 'confirmed',
      probability: 0.95,
      source: 'pluto_data',
      building,
      reason: `${unitsRes} units built in ${yearBuilt} (pre-1974 with 6+ units)`
    };
  }

  // 6+ units built 1974-1984 = possibly rent stabilized (J-51/421-a tax benefits)
  if (unitsRes >= 6 && yearBuilt >= 1974 && yearBuilt <= 1984) {
    return {
      status: 'probable',
      probability: 0.70,
      source: 'pluto_data',
      building,
      reason: `${unitsRes} units built in ${yearBuilt} (may have J-51/421-a benefits)`
    };
  }

  // 6+ units built after 1984 = less likely but possible (421-a buildings)
  if (unitsRes >= 6 && yearBuilt > 1984 && yearBuilt <= 2015) {
    return {
      status: 'probable',
      probability: 0.40,
      source: 'pluto_data',
      building,
      reason: `${unitsRes} units built in ${yearBuilt} (possible 421-a building)`
    };
  }

  // Large buildings (50+ units) have higher probability regardless of year
  if (unitsRes >= 50) {
    return {
      status: 'probable',
      probability: 0.75,
      source: 'pluto_data',
      building,
      reason: `Large building with ${unitsRes} units`
    };
  }

  // Default case: 6+ units, newer building
  return {
    status: 'unlikely',
    probability: 0.20,
    source: 'pluto_data',
    building,
    reason: `${unitsRes} units built in ${yearBuilt || 'unknown year'}`
  };
}

/**
 * Get rent stabilization status for a listing
 */
export async function getRentStabilizationStatus(
  latitude: number,
  longitude: number,
  address?: string
): Promise<RentStabilizationResult> {
  // Try to get building from PLUTO
  const building = await getPlutoBuildingByLocation(latitude, longitude);

  if (!building) {
    // No PLUTO data found, use heuristic based on neighborhood
    return {
      status: 'unknown',
      probability: 0.30,
      source: 'heuristic',
      reason: 'No building data found, using neighborhood estimate'
    };
  }

  return calculateRentStabilizationProbability(building);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Check building cache
 */
async function checkBuildingCache(latitude: number, longitude: number): Promise<any | null> {
  try {
    const minLat = latitude - LOCATION_TOLERANCE;
    const maxLat = latitude + LOCATION_TOLERANCE;
    const minLng = longitude - LOCATION_TOLERANCE;
    const maxLng = longitude + LOCATION_TOLERANCE;

    const cached = await db.query.buildingCache.findFirst({
      where: and(
        // Simple range check since we don't have advanced geospatial queries
        // This is good enough for ~50 meter radius
        eq(buildingCache.latitude, latitude),
        eq(buildingCache.longitude, longitude)
      )
    });

    if (cached) {
      // Update cache hit count
      await db.update(buildingCache)
        .set({
          cacheHitCount: (cached.cacheHitCount || 0) + 1,
          lastQueriedAt: new Date()
        })
        .where(eq(buildingCache.id, cached.id));

      return cached;
    }

    return null;
  } catch (error) {
    console.error('Cache lookup error:', error);
    return null;
  }
}

/**
 * Cache building data
 */
async function cacheBuildingData(
  building: PlutoBuilding,
  searchLat: number,
  searchLng: number
): Promise<void> {
  try {
    const result = calculateRentStabilizationProbability(building);

    await db.insert(buildingCache).values({
      addressNormalized: building.address?.toLowerCase() || '',
      latitude: searchLat,
      longitude: searchLng,
      dhcrBuildingId: building.bbl,
      isRentStabilized: result.status === 'confirmed' || result.status === 'probable',
      stabilizedUnitCount: result.status === 'confirmed' ? parseInt(building.unitsres) : null,
      totalUnitCount: parseInt(building.unitsres) || null,
      heuristicProbability: result.probability,
      buildingYearBuilt: parseInt(building.yearbuilt) || null,
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Export for testing
export const _internal = {
  calculateDistance,
  LOCATION_TOLERANCE
};