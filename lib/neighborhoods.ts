/**
 * NYC Neighborhoods Data
 *
 * Organized by borough with area groupings
 * Based on StreetEasy's neighborhood structure
 */

export type NeighborhoodGroup = {
  label: string;
  neighborhoods: string[];
};

export type Borough = {
  name: string;
  groups: NeighborhoodGroup[];
};

export const NYC_NEIGHBORHOODS: Borough[] = [
  {
    name: "Manhattan",
    groups: [
      {
        label: "ALL DOWNTOWN",
        neighborhoods: [
          "Battery Park City",
          "Chelsea",
          "Chinatown",
          "Civic Center",
          "East Village",
          "Financial District",
          "Flatiron",
          "Fulton/Seaport",
          "Gramercy Park",
          "Greenwich Village",
          "Hudson Square",
          "Little Italy",
          "Lower East Side",
          "Noho",
          "Nolita",
          "NoMad",
          "Soho",
          "Stuyvesant Town/PCV",
          "Tribeca",
          "Two Bridges",
          "West Chelsea",
          "West Village",
        ],
      },
      {
        label: "ALL MIDTOWN",
        neighborhoods: [
          "Beekman",
          "Central Park South",
          "Hell's Kitchen",
          "Hudson Yards",
          "Kips Bay",
          "Midtown",
          "Midtown East",
          "Midtown South",
          "Midtown West",
          "Murray Hill",
          "Sutton Place",
          "Turtle Bay",
        ],
      },
      {
        label: "ALL UPPER EAST SIDE",
        neighborhoods: [
          "Carnegie Hill",
          "Lenox Hill",
          "Upper Carnegie Hill",
          "Upper East Side",
          "Yorkville",
        ],
      },
      {
        label: "ALL UPPER WEST SIDE",
        neighborhoods: [
          "Lincoln Square",
          "Manhattan Valley",
          "Upper West Side",
        ],
      },
      {
        label: "ALL UPPER MANHATTAN",
        neighborhoods: [
          "Central Harlem",
          "East Harlem",
          "Fort George",
          "Hamilton Heights",
          "Hudson Heights",
          "Inwood",
          "Manhattanville",
          "Marble Hill",
          "Morningside Heights",
          "South Harlem",
          "Washington Heights",
          "West Harlem",
        ],
      },
      {
        label: "ROOSEVELT ISLAND",
        neighborhoods: ["Roosevelt Island"],
      },
    ],
  },
  {
    name: "Brooklyn",
    groups: [
      {
        label: "ALL BROOKLYN",
        neighborhoods: [
          "Bath Beach",
          "Bay Ridge",
          "Bedford-Stuyvesant",
          "Bensonhurst",
          "Bergen Beach",
          "Boerum Hill",
          "Borough Park",
          "Brighton Beach",
          "Brooklyn Heights",
          "Brownsville",
          "Bushwick",
          "Canarsie",
          "Carroll Gardens",
          "City Line",
          "Clinton Hill",
          "Cobble Hill",
          "Columbia St Waterfront District",
          "Coney Island",
          "Crown Heights",
          "Cypress Hills",
          "Ditmas Park",
          "Downtown Brooklyn",
          "DUMBO",
          "Dyker Heights",
          "East Flatbush",
          "East New York",
          "East Williamsburg",
          "Farragut",
          "Fiske Terrace",
          "Flatbush",
          "Flatlands",
          "Fort Greene",
          "Fort Hamilton",
          "Gerritsen Beach",
          "Gowanus",
          "Gravesend",
          "Greenpoint",
          "Greenwood",
          "Homecrest",
          "Kensington",
          "Madison",
          "Manhattan Beach",
          "Mapleton",
          "Marine Park",
          "Midwood",
          "Mill Basin",
          "New Lots",
          "Ocean Hill",
          "Ocean Parkway",
          "Old Mill Basin",
          "Park Slope",
          "Prospect Heights",
          "Prospect Lefferts Gardens",
          "Prospect Park South",
          "Red Hook",
          "Seagate",
          "Sheepshead Bay",
          "Starrett City",
          "Stuyvesant Heights",
          "Sunset Park",
          "Vinegar Hill",
          "Weeksville",
          "Williamsburg",
          "Windsor Terrace",
          "Wingate",
        ],
      },
    ],
  },
];

/**
 * Get all neighborhoods as a flat array
 */
export function getAllNeighborhoods(): string[] {
  return NYC_NEIGHBORHOODS.flatMap(borough =>
    borough.groups.flatMap(group => group.neighborhoods)
  );
}

/**
 * Get neighborhoods for a specific borough
 */
export function getNeighborhoodsByBorough(boroughName: string): string[] {
  const borough = NYC_NEIGHBORHOODS.find(b => b.name === boroughName);
  return borough
    ? borough.groups.flatMap(group => group.neighborhoods)
    : [];
}
