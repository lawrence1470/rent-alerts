/**
 * NYC Neighborhood Constants for StreetEasy API
 *
 * Grouped by borough for better UX in autocomplete.
 * Values match StreetEasy API parameter format (lowercase, hyphenated).
 */

export interface Neighborhood {
  value: string; // API value (e.g., "williamsburg")
  label: string; // Display name (e.g., "Williamsburg")
  borough: string;
}

export const NYC_NEIGHBORHOODS: Neighborhood[] = [
  // Brooklyn
  { value: "williamsburg", label: "Williamsburg", borough: "Brooklyn" },
  { value: "greenpoint", label: "Greenpoint", borough: "Brooklyn" },
  { value: "bushwick", label: "Bushwick", borough: "Brooklyn" },
  { value: "bedford-stuyvesant", label: "Bedford-Stuyvesant", borough: "Brooklyn" },
  { value: "park-slope", label: "Park Slope", borough: "Brooklyn" },
  { value: "prospect-heights", label: "Prospect Heights", borough: "Brooklyn" },
  { value: "crown-heights", label: "Crown Heights", borough: "Brooklyn" },
  { value: "fort-greene", label: "Fort Greene", borough: "Brooklyn" },
  { value: "brooklyn-heights", label: "Brooklyn Heights", borough: "Brooklyn" },
  { value: "dumbo", label: "DUMBO", borough: "Brooklyn" },
  { value: "downtown-brooklyn", label: "Downtown Brooklyn", borough: "Brooklyn" },
  { value: "cobble-hill", label: "Cobble Hill", borough: "Brooklyn" },
  { value: "carroll-gardens", label: "Carroll Gardens", borough: "Brooklyn" },
  { value: "boerum-hill", label: "Boerum Hill", borough: "Brooklyn" },
  { value: "gowanus", label: "Gowanus", borough: "Brooklyn" },
  { value: "sunset-park", label: "Sunset Park", borough: "Brooklyn" },
  { value: "bay-ridge", label: "Bay Ridge", borough: "Brooklyn" },
  { value: "dyker-heights", label: "Dyker Heights", borough: "Brooklyn" },
  { value: "bensonhurst", label: "Bensonhurst", borough: "Brooklyn" },
  { value: "red-hook", label: "Red Hook", borough: "Brooklyn" },
  { value: "clinton-hill", label: "Clinton Hill", borough: "Brooklyn" },
  { value: "prospect-lefferts-gardens", label: "Prospect Lefferts Gardens", borough: "Brooklyn" },
  { value: "flatbush", label: "Flatbush", borough: "Brooklyn" },
  { value: "ditmas-park", label: "Ditmas Park", borough: "Brooklyn" },
  { value: "kensington", label: "Kensington", borough: "Brooklyn" },
  { value: "midwood", label: "Midwood", borough: "Brooklyn" },
  { value: "sheepshead-bay", label: "Sheepshead Bay", borough: "Brooklyn" },
  { value: "marine-park", label: "Marine Park", borough: "Brooklyn" },
  { value: "canarsie", label: "Canarsie", borough: "Brooklyn" },
  { value: "east-flatbush", label: "East Flatbush", borough: "Brooklyn" },
  { value: "brownsville", label: "Brownsville", borough: "Brooklyn" },
  { value: "east-new-york", label: "East New York", borough: "Brooklyn" },

  // Manhattan
  { value: "financial-district", label: "Financial District", borough: "Manhattan" },
  { value: "tribeca", label: "Tribeca", borough: "Manhattan" },
  { value: "battery-park-city", label: "Battery Park City", borough: "Manhattan" },
  { value: "chinatown", label: "Chinatown", borough: "Manhattan" },
  { value: "little-italy", label: "Little Italy", borough: "Manhattan" },
  { value: "lower-east-side", label: "Lower East Side", borough: "Manhattan" },
  { value: "soho", label: "SoHo", borough: "Manhattan" },
  { value: "nolita", label: "NoLita", borough: "Manhattan" },
  { value: "west-village", label: "West Village", borough: "Manhattan" },
  { value: "greenwich-village", label: "Greenwich Village", borough: "Manhattan" },
  { value: "east-village", label: "East Village", borough: "Manhattan" },
  { value: "noho", label: "NoHo", borough: "Manhattan" },
  { value: "gramercy-park", label: "Gramercy Park", borough: "Manhattan" },
  { value: "flatiron", label: "Flatiron", borough: "Manhattan" },
  { value: "union-square", label: "Union Square", borough: "Manhattan" },
  { value: "chelsea", label: "Chelsea", borough: "Manhattan" },
  { value: "kips-bay", label: "Kips Bay", borough: "Manhattan" },
  { value: "murray-hill", label: "Murray Hill", borough: "Manhattan" },
  { value: "midtown", label: "Midtown", borough: "Manhattan" },
  { value: "midtown-east", label: "Midtown East", borough: "Manhattan" },
  { value: "midtown-west", label: "Midtown West", borough: "Manhattan" },
  { value: "hells-kitchen", label: "Hell's Kitchen", borough: "Manhattan" },
  { value: "upper-west-side", label: "Upper West Side", borough: "Manhattan" },
  { value: "upper-east-side", label: "Upper East Side", borough: "Manhattan" },
  { value: "lincoln-square", label: "Lincoln Square", borough: "Manhattan" },
  { value: "central-park", label: "Central Park", borough: "Manhattan" },
  { value: "yorkville", label: "Yorkville", borough: "Manhattan" },
  { value: "carnegie-hill", label: "Carnegie Hill", borough: "Manhattan" },
  { value: "lenox-hill", label: "Lenox Hill", borough: "Manhattan" },
  { value: "sutton-place", label: "Sutton Place", borough: "Manhattan" },
  { value: "tudor-city", label: "Tudor City", borough: "Manhattan" },
  { value: "roosevelt-island", label: "Roosevelt Island", borough: "Manhattan" },
  { value: "morningside-heights", label: "Morningside Heights", borough: "Manhattan" },
  { value: "harlem", label: "Harlem", borough: "Manhattan" },
  { value: "east-harlem", label: "East Harlem", borough: "Manhattan" },
  { value: "hamilton-heights", label: "Hamilton Heights", borough: "Manhattan" },
  { value: "washington-heights", label: "Washington Heights", borough: "Manhattan" },
  { value: "inwood", label: "Inwood", borough: "Manhattan" },

  // Queens
  { value: "astoria", label: "Astoria", borough: "Queens" },
  { value: "long-island-city", label: "Long Island City", borough: "Queens" },
  { value: "sunnyside", label: "Sunnyside", borough: "Queens" },
  { value: "woodside", label: "Woodside", borough: "Queens" },
  { value: "jackson-heights", label: "Jackson Heights", borough: "Queens" },
  { value: "elmhurst", label: "Elmhurst", borough: "Queens" },
  { value: "corona", label: "Corona", borough: "Queens" },
  { value: "forest-hills", label: "Forest Hills", borough: "Queens" },
  { value: "rego-park", label: "Rego Park", borough: "Queens" },
  { value: "kew-gardens", label: "Kew Gardens", borough: "Queens" },
  { value: "flushing", label: "Flushing", borough: "Queens" },
  { value: "bayside", label: "Bayside", borough: "Queens" },
  { value: "whitestone", label: "Whitestone", borough: "Queens" },
  { value: "ridgewood", label: "Ridgewood", borough: "Queens" },
  { value: "middle-village", label: "Middle Village", borough: "Queens" },
  { value: "maspeth", label: "Maspeth", borough: "Queens" },
  { value: "glendale", label: "Glendale", borough: "Queens" },
  { value: "richmond-hill", label: "Richmond Hill", borough: "Queens" },
  { value: "kew-gardens-hills", label: "Kew Gardens Hills", borough: "Queens" },
  { value: "fresh-meadows", label: "Fresh Meadows", borough: "Queens" },
  { value: "jamaica", label: "Jamaica", borough: "Queens" },
  { value: "jamaica-estates", label: "Jamaica Estates", borough: "Queens" },
  { value: "hollis", label: "Hollis", borough: "Queens" },
  { value: "queens-village", label: "Queens Village", borough: "Queens" },
  { value: "howard-beach", label: "Howard Beach", borough: "Queens" },
  { value: "ozone-park", label: "Ozone Park", borough: "Queens" },
  { value: "south-ozone-park", label: "South Ozone Park", borough: "Queens" },
  { value: "rockaway-beach", label: "Rockaway Beach", borough: "Queens" },
  { value: "far-rockaway", label: "Far Rockaway", borough: "Queens" },

  // Bronx
  { value: "mott-haven", label: "Mott Haven", borough: "Bronx" },
  { value: "hunts-point", label: "Hunts Point", borough: "Bronx" },
  { value: "longwood", label: "Longwood", borough: "Bronx" },
  { value: "melrose", label: "Melrose", borough: "Bronx" },
  { value: "concourse", label: "Concourse", borough: "Bronx" },
  { value: "highbridge", label: "Highbridge", borough: "Bronx" },
  { value: "morrisania", label: "Morrisania", borough: "Bronx" },
  { value: "fordham", label: "Fordham", borough: "Bronx" },
  { value: "belmont", label: "Belmont", borough: "Bronx" },
  { value: "kingsbridge", label: "Kingsbridge", borough: "Bronx" },
  { value: "riverdale", label: "Riverdale", borough: "Bronx" },
  { value: "bedford-park", label: "Bedford Park", borough: "Bronx" },
  { value: "norwood", label: "Norwood", borough: "Bronx" },
  { value: "pelham-bay", label: "Pelham Bay", borough: "Bronx" },
  { value: "throgs-neck", label: "Throgs Neck", borough: "Bronx" },
  { value: "city-island", label: "City Island", borough: "Bronx" },
  { value: "soundview", label: "Soundview", borough: "Bronx" },
  { value: "parkchester", label: "Parkchester", borough: "Bronx" },
  { value: "castle-hill", label: "Castle Hill", borough: "Bronx" },
  { value: "clason-point", label: "Clason Point", borough: "Bronx" },
  { value: "westchester-square", label: "Westchester Square", borough: "Bronx" },

  // Staten Island
  { value: "st-george", label: "St. George", borough: "Staten Island" },
  { value: "tompkinsville", label: "Tompkinsville", borough: "Staten Island" },
  { value: "stapleton", label: "Stapleton", borough: "Staten Island" },
  { value: "port-richmond", label: "Port Richmond", borough: "Staten Island" },
  { value: "west-brighton", label: "West Brighton", borough: "Staten Island" },
  { value: "new-brighton", label: "New Brighton", borough: "Staten Island" },
  { value: "graniteville", label: "Graniteville", borough: "Staten Island" },
  { value: "bulls-head", label: "Bulls Head", borough: "Staten Island" },
  { value: "travis", label: "Travis", borough: "Staten Island" },
  { value: "tottenville", label: "Tottenville", borough: "Staten Island" },
  { value: "great-kills", label: "Great Kills", borough: "Staten Island" },
  { value: "eltingville", label: "Eltingville", borough: "Staten Island" },
  { value: "annadale", label: "Annadale", borough: "Staten Island" },
  { value: "bay-terrace", label: "Bay Terrace", borough: "Staten Island" },
];

export const BOROUGHS = ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island"] as const;

/**
 * Group neighborhoods by borough for dropdown display
 */
export function getNeighborhoodsByBorough() {
  const grouped: Record<string, Neighborhood[]> = {};

  NYC_NEIGHBORHOODS.forEach((neighborhood) => {
    if (!grouped[neighborhood.borough]) {
      grouped[neighborhood.borough] = [];
    }
    grouped[neighborhood.borough].push(neighborhood);
  });

  return grouped;
}

/**
 * Search neighborhoods by query string (case-insensitive)
 */
export function searchNeighborhoods(query: string): Neighborhood[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  return NYC_NEIGHBORHOODS.filter((neighborhood) =>
    neighborhood.label.toLowerCase().includes(normalizedQuery) ||
    neighborhood.value.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get neighborhood by value
 */
export function getNeighborhoodByValue(value: string): Neighborhood | undefined {
  return NYC_NEIGHBORHOODS.find((n) => n.value === value);
}

/**
 * Convert comma-separated string to array of neighborhood values
 */
export function parseAreasString(areas: string): string[] {
  return areas.split(',').map(a => a.trim()).filter(Boolean);
}

/**
 * Convert array of neighborhood values to comma-separated string
 */
export function formatAreasString(areas: string[]): string {
  return areas.join(',');
}
