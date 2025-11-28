/**
 * StreetEasy Area Slugs
 *
 * Valid borough slugs for StreetEasy URLs.
 * URL format: https://streeteasy.com/for-rent/{slug}
 *
 * Currently simplified to borough-level. Neighborhoods can be added later.
 */

// Valid StreetEasy borough slugs
export const STREETEASY_BOROUGH_SLUGS: string[] = [
  'manhattan',
  'brooklyn',
  'queens',
  'bronx',
  'staten-island',
];

// Slug validation - check if a slug is a valid borough
export function isValidAreaSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  return STREETEASY_BOROUGH_SLUGS.includes(normalized);
}

// Normalize area string to slug format
export function normalizeToSlug(areaName: string): string {
  return areaName.toLowerCase().trim().replace(/\s+/g, '-');
}

// Get all valid slugs from a comma-separated area string
export function getValidSlugs(areasString: string): string[] {
  return areasString
    .split(',')
    .map((area) => normalizeToSlug(area.trim()))
    .filter((slug) => slug.length > 0 && isValidAreaSlug(slug));
}

// Expand meta-areas (for future neighborhood support)
// Currently just returns the input slugs unchanged
export function expandMetaAreas(areas: string[]): string[] {
  return areas.filter(slug => isValidAreaSlug(slug));
}
