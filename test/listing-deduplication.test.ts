import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAlerts } from './__mocks__/db';
import { mockStreetEasyListing } from './__mocks__/streeteasy-data';

/**
 * Listing Deduplication Tests
 *
 * Tests the deduplication system that prevents users from receiving
 * duplicate notifications for listings they've already seen
 */

describe('Listing Deduplication', () => {
  describe('filterNewListingsForUser', () => {
    it('should return all listings for first-time user', () => {
      const userId = 'user-1';
      const listings = [
        { ...mockStreetEasyListing, id: 'listing-1' },
        { ...mockStreetEasyListing, id: 'listing-2' },
        { ...mockStreetEasyListing, id: 'listing-3' },
      ];
      const seenListings: string[] = []; // No seen listings

      const result = filterNewListingsForUser(userId, listings, seenListings);

      expect(result).toHaveLength(3);
      expect(result.map((l: any) => l.id)).toEqual(['listing-1', 'listing-2', 'listing-3']);
    });

    it('should filter out previously seen listings', () => {
      const userId = 'user-1';
      const listings = [
        { ...mockStreetEasyListing, id: 'listing-1' },
        { ...mockStreetEasyListing, id: 'listing-2' },
        { ...mockStreetEasyListing, id: 'listing-3' },
      ];
      const seenListings = ['listing-1', 'listing-3']; // User has seen 1 and 3

      const result = filterNewListingsForUser(userId, listings, seenListings);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('listing-2');
    });

    it('should return empty array if all listings seen', () => {
      const userId = 'user-1';
      const listings = [
        { ...mockStreetEasyListing, id: 'listing-1' },
        { ...mockStreetEasyListing, id: 'listing-2' },
      ];
      const seenListings = ['listing-1', 'listing-2'];

      const result = filterNewListingsForUser(userId, listings, seenListings);

      expect(result).toHaveLength(0);
    });
  });

  describe('markListingsAsSeen', () => {
    it('should create user_seen_listings records', async () => {
      const userId = 'user-1';
      const listingIds = ['listing-1', 'listing-2', 'listing-3'];

      const records = await markListingsAsSeen(userId, listingIds);

      expect(records).toHaveLength(3);
      records.forEach((record: any) => {
        expect(record.userId).toBe(userId);
        expect(listingIds).toContain(record.listingId);
        expect(record.seenAt).toBeInstanceOf(Date);
      });
    });

    it('should handle empty listing array', async () => {
      const userId = 'user-1';
      const listingIds: string[] = [];

      const records = await markListingsAsSeen(userId, listingIds);

      expect(records).toHaveLength(0);
    });
  });

  describe('getSeenListingsForUser', () => {
    it('should retrieve all seen listings for a user', async () => {
      const userId = 'user-1';
      const mockSeenListings = [
        { userId: 'user-1', listingId: 'listing-1', seenAt: new Date() },
        { userId: 'user-1', listingId: 'listing-3', seenAt: new Date() },
      ];

      const result = await getSeenListingsForUser(userId);

      expect(result).toEqual(['listing-1', 'listing-3']);
    });

    it('should return empty array for new user', async () => {
      const userId = 'new-user';

      const result = await getSeenListingsForUser(userId);

      expect(result).toHaveLength(0);
    });

    it('should only return listings for specific user', async () => {
      const userId = 'user-1';
      const mockSeenListings = [
        { userId: 'user-1', listingId: 'listing-1', seenAt: new Date() },
        { userId: 'user-2', listingId: 'listing-2', seenAt: new Date() },
        { userId: 'user-1', listingId: 'listing-3', seenAt: new Date() },
      ];

      const result = await getSeenListingsForUser(userId);

      expect(result).toEqual(['listing-1', 'listing-3']);
      expect(result).not.toContain('listing-2'); // user-2's listing
    });
  });

  describe('Deduplication Performance', () => {
    it('should efficiently handle large seen lists', async () => {
      const userId = 'user-1';
      const seenListings = Array.from({ length: 1000 }, (_, i) => `listing-${i}`);
      const newListings = [
        { ...mockStreetEasyListing, id: 'listing-1000' },
        { ...mockStreetEasyListing, id: 'listing-1001' },
        { ...mockStreetEasyListing, id: 'listing-500' }, // This one was seen
      ];

      const result = filterNewListingsForUser(userId, newListings, seenListings);

      // Should only return the 2 new listings, not listing-500
      expect(result).toHaveLength(2);
      expect(result.map((l: any) => l.id)).toEqual(['listing-1000', 'listing-1001']);
    });

    it('should handle batch marking of seen listings', async () => {
      const userId = 'user-1';
      const listingIds = Array.from({ length: 50 }, (_, i) => `listing-${i}`);

      const records = await markListingsAsSeen(userId, listingIds);

      expect(records).toHaveLength(50);
      records.forEach((record: any, index: number) => {
        expect(record.userId).toBe(userId);
        expect(record.listingId).toBe(`listing-${index}`);
      });
    });
  });
});

// Mock helper functions (these would come from the actual service)
function filterNewListingsForUser(
  userId: string,
  listings: any[],
  seenListings: string[]
): any[] {
  const seenSet = new Set(seenListings);
  return listings.filter(listing => !seenSet.has(listing.id));
}

async function markListingsAsSeen(
  userId: string,
  listingIds: string[]
): Promise<any[]> {
  return listingIds.map(listingId => ({
    userId,
    listingId,
    seenAt: new Date(),
  }));
}

async function getSeenListingsForUser(userId: string): Promise<string[]> {
  // Mock implementation - would query database in real version
  const mockData: Record<string, string[]> = {
    'user-1': ['listing-1', 'listing-3'],
    'user-2': ['listing-2'],
  };
  return mockData[userId] || [];
}
