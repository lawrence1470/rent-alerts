/**
 * Mock database for testing
 * Simulates Drizzle ORM operations without hitting real database
 */

import { vi } from 'vitest';

export const mockDb = {
  query: {
    alerts: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    alertBatches: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    listings: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    userSeenListings: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    notifications: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  }),
};

export const mockAlerts = [
  {
    id: "alert-1",
    userId: "user-1",
    name: "East Village 2BR under $3500",
    areas: "east-village",
    minPrice: 2000,
    maxPrice: 3500,
    minBeds: 2,
    maxBeds: 2,
    minBaths: 1,
    noFee: false,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastChecked: null,
  },
  {
    id: "alert-2",
    userId: "user-2",
    name: "West Village Studio under $3000",
    areas: "west-village",
    minPrice: 2000,
    maxPrice: 3000,
    minBeds: 0,
    maxBeds: 1,
    minBaths: 1,
    noFee: true,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastChecked: null,
  },
  {
    id: "alert-3",
    userId: "user-1",
    name: "East Village 2BR under $3000",
    areas: "east-village",
    minPrice: 2000,
    maxPrice: 3000,
    minBeds: 2,
    maxBeds: 2,
    minBaths: 1,
    noFee: false,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastChecked: null,
  },
];
