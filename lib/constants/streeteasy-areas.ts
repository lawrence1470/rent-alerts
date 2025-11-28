/**
 * StreetEasy Area Slugs
 *
 * Valid neighborhood slugs for StreetEasy URLs.
 * URL format: https://streeteasy.com/for-rent/{slug}
 *
 * These slugs are used in the direct URL path format which works
 * reliably for single-area searches.
 */

// All valid StreetEasy neighborhood slugs (discovered from streeteasy.com/neighborhoods)
export const STREETEASY_AREA_SLUGS: string[] = [
  // Manhattan - Downtown
  'battery-park-city',
  'civic-center',
  'east-village',
  'financial-district',
  'flatiron',
  'gramercy-park',
  'greenwich-village',
  'les', // Lower East Side
  'lower-east-side',
  'nolita',
  'noho',
  'soho',
  'tribeca',
  'west-village',

  // Manhattan - Midtown
  'chelsea',
  'hells-kitchen',
  'kips-bay',
  'midtown',
  'midtown-east',
  'midtown-south',
  'midtown-west',
  'murray-hill',
  'nomad',
  'stuyvesant-town',
  'sutton-place',
  'tudor-city',
  'turtle-bay',

  // Manhattan - Upper East Side
  'lenox-hill',
  'upper-east-side',
  'yorkville',
  'carnegie-hill',
  'roosevelt-island',

  // Manhattan - Upper West Side
  'lincoln-square',
  'upper-west-side',

  // Manhattan - Upper Manhattan
  'central-harlem',
  'east-harlem',
  'hamilton-heights',
  'harlem',
  'inwood',
  'manhattanville',
  'morningside-heights',
  'washington-heights',

  // Brooklyn - North
  'brooklyn-heights',
  'downtown-brooklyn',
  'dumbo',
  'fulton-ferry',
  'vinegar-hill',

  // Brooklyn - Williamsburg & Greenpoint
  'greenpoint',
  'williamsburg',

  // Brooklyn - Fort Greene & Clinton Hill
  'clinton-hill',
  'fort-greene',

  // Brooklyn - Bed-Stuy & Crown Heights
  'bedford-stuyvesant',
  'bed-stuy',
  'crown-heights',
  'prospect-lefferts-gardens',
  'weeksville',

  // Brooklyn - Park Slope & Prospect Heights
  'boerum-hill',
  'carroll-gardens',
  'cobble-hill',
  'gowanus',
  'park-slope',
  'prospect-heights',
  'red-hook',

  // Brooklyn - South
  'bay-ridge',
  'bensonhurst',
  'borough-park',
  'brighton-beach',
  'coney-island',
  'ditmas-park',
  'flatbush',
  'gravesend',
  'kensington',
  'midwood',
  'sheepshead-bay',
  'sunset-park',
  'windsor-terrace',

  // Brooklyn - East
  'brownsville',
  'bushwick',
  'canarsie',
  'cypress-hills',
  'east-flatbush',
  'east-new-york',

  // Queens
  'astoria',
  'bayside',
  'corona',
  'elmhurst',
  'flushing',
  'forest-hills',
  'jackson-heights',
  'jamaica',
  'kew-gardens',
  'long-island-city',
  'maspeth',
  'middle-village',
  'rego-park',
  'ridgewood',
  'rockaway',
  'sunnyside',
  'woodside',

  // Bronx
  'belmont',
  'concourse',
  'fordham',
  'hunts-point',
  'kingsbridge',
  'mott-haven',
  'riverdale',
  'tremont',
  'university-heights',
  'wakefield',

  // Staten Island
  'great-kills',
  'new-dorp',
  'port-richmond',
  'st-george',
  'stapleton',
  'tottenville',
];

// Slug validation - check if a slug is valid
export function isValidAreaSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim().replace(/\s+/g, '-');
  return STREETEASY_AREA_SLUGS.includes(normalized);
}

// Normalize area name to slug format
export function normalizeToSlug(areaName: string): string {
  return areaName.toLowerCase().trim().replace(/\s+/g, '-');
}

// Get all valid slugs from a comma-separated area string
export function getValidSlugs(areasString: string): string[] {
  return areasString
    .split(',')
    .map((area) => normalizeToSlug(area.trim()))
    .filter((slug) => slug.length > 0);
}

// Meta-areas that cover multiple neighborhoods (for future optimization)
export const META_AREAS: Record<string, string[]> = {
  'all-downtown': [
    'battery-park-city',
    'civic-center',
    'east-village',
    'financial-district',
    'flatiron',
    'gramercy-park',
    'greenwich-village',
    'les',
    'nolita',
    'noho',
    'soho',
    'tribeca',
    'west-village',
  ],
  'all-midtown': [
    'chelsea',
    'hells-kitchen',
    'kips-bay',
    'midtown',
    'midtown-east',
    'midtown-south',
    'midtown-west',
    'murray-hill',
    'nomad',
    'stuyvesant-town',
    'sutton-place',
    'tudor-city',
    'turtle-bay',
  ],
  'all-upper-east-side': [
    'lenox-hill',
    'upper-east-side',
    'yorkville',
    'carnegie-hill',
    'roosevelt-island',
  ],
  'all-upper-west-side': ['lincoln-square', 'upper-west-side'],
  'all-harlem': [
    'central-harlem',
    'east-harlem',
    'hamilton-heights',
    'harlem',
    'manhattanville',
    'morningside-heights',
  ],
  'all-brooklyn': [
    'brooklyn-heights',
    'downtown-brooklyn',
    'dumbo',
    'williamsburg',
    'greenpoint',
    'fort-greene',
    'clinton-hill',
    'bed-stuy',
    'crown-heights',
    'park-slope',
    'prospect-heights',
    'cobble-hill',
    'carroll-gardens',
    'boerum-hill',
    'gowanus',
    'red-hook',
    'bushwick',
    'flatbush',
    'ditmas-park',
    'bay-ridge',
    'sunset-park',
  ],
};

// Expand meta-areas to individual slugs
export function expandMetaAreas(areas: string[]): string[] {
  const expanded = new Set<string>();

  for (const area of areas) {
    const normalized = normalizeToSlug(area);
    if (META_AREAS[normalized]) {
      META_AREAS[normalized].forEach((slug) => expanded.add(slug));
    } else {
      expanded.add(normalized);
    }
  }

  return Array.from(expanded);
}
