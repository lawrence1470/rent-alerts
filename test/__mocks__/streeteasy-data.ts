/**
 * Mock StreetEasy API responses for testing
 * Based on actual StreetEasy API structure
 */

export const mockStreetEasyListing = {
  id: "12345678",
  title: "Spacious 2BR in East Village",
  address: "123 Avenue A",
  neighborhood: "east-village",
  price: 3200,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 900,
  noFee: true,
  listingUrl: "https://streeteasy.com/rental/12345678",
  imageUrl: "https://streeteasy.com/images/12345678.jpg",
  description: "Beautiful apartment with lots of light",
  amenities: ["dishwasher", "laundry"],
  availableDate: "2025-12-01",
};

export const mockStreetEasyResponse = {
  status: "success",
  data: {
    listings: [
      mockStreetEasyListing,
      {
        id: "87654321",
        title: "Cozy Studio in West Village",
        address: "456 Bleecker St",
        neighborhood: "west-village",
        price: 2800,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 500,
        noFee: false,
        listingUrl: "https://streeteasy.com/rental/87654321",
        imageUrl: "https://streeteasy.com/images/87654321.jpg",
        description: "Charming studio apartment",
        amenities: ["elevator"],
        availableDate: "2025-11-15",
      },
      {
        id: "11112222",
        title: "Luxury 3BR in Tribeca",
        address: "789 Hudson St",
        neighborhood: "tribeca",
        price: 6500,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        noFee: true,
        listingUrl: "https://streeteasy.com/rental/11112222",
        imageUrl: "https://streeteasy.com/images/11112222.jpg",
        description: "High-end apartment with amazing views",
        amenities: ["doorman", "gym", "roof-deck"],
        availableDate: "2025-12-15",
      },
    ],
    meta: {
      total: 3,
      offset: 0,
      limit: 100,
    },
  },
};

export const mockEmptyResponse = {
  status: "success",
  data: {
    listings: [],
    meta: {
      total: 0,
      offset: 0,
      limit: 100,
    },
  },
};

export const mockAPIError = {
  status: "error",
  message: "Rate limit exceeded",
  code: 429,
};
