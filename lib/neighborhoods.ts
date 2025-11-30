/**
 * NYC Boroughs Data
 *
 * Simplified to borough-level selection.
 * Each borough maps directly to a StreetEasy URL slug.
 */

export type Borough = {
  name: string;
  slug: string;  // StreetEasy URL slug
};

export const NYC_BOROUGHS: Borough[] = [
  { name: "Manhattan", slug: "manhattan" },
  { name: "Brooklyn", slug: "brooklyn" },
  { name: "Queens", slug: "queens" },
  { name: "Bronx", slug: "bronx" },
  { name: "Staten Island", slug: "staten-island" },
];

/**
 * Get all borough names
 */
export function getAllBoroughNames(): string[] {
  return NYC_BOROUGHS.map(b => b.name);
}

/**
 * Get all borough slugs
 */
export function getAllBoroughSlugs(): string[] {
  return NYC_BOROUGHS.map(b => b.slug);
}

/**
 * Convert borough name to slug
 */
export function boroughNameToSlug(name: string): string | null {
  const borough = NYC_BOROUGHS.find(b => b.name.toLowerCase() === name.toLowerCase());
  return borough?.slug ?? null;
}

/**
 * Convert borough slug to name
 */
export function boroughSlugToName(slug: string): string | null {
  const borough = NYC_BOROUGHS.find(b => b.slug === slug.toLowerCase());
  return borough?.name ?? null;
}

/**
 * Check if a slug is a valid borough
 */
export function isValidBoroughSlug(slug: string): boolean {
  return NYC_BOROUGHS.some(b => b.slug === slug.toLowerCase());
}
