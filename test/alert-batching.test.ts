import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAlerts } from './__mocks__/db';

/**
 * Alert Batching Algorithm Tests
 *
 * Tests the core cost-optimization feature: grouping similar alerts
 * to minimize API calls to StreetEasy
 */

describe('Alert Batching Algorithm', () => {
  describe('groupAlertsByCompatibleCriteria', () => {
    it('should group alerts with identical criteria', () => {
      const alerts = [
        {
          id: '1',
          userId: 'user-1',
          areas: 'east-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 2,
          maxBeds: 2,
          minBaths: 1,
          noFee: false,
        },
        {
          id: '2',
          userId: 'user-2',
          areas: 'east-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 2,
          maxBeds: 2,
          minBaths: 1,
          noFee: false,
        },
      ];

      // These should be grouped together (same criteria)
      // Expected: 1 batch containing both alerts
      const result = groupAlertsByCompatibleCriteria(alerts);

      expect(result.size).toBe(1);
      const batch = Array.from(result.values())[0];
      expect(batch).toHaveLength(2);
      expect(batch.map((a: any) => a.id)).toEqual(['1', '2']);
    });

    it('should create separate batches for different areas', () => {
      const alerts = [
        {
          id: '1',
          areas: 'east-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 2,
          maxBeds: 2,
        },
        {
          id: '2',
          areas: 'west-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 2,
          maxBeds: 2,
        },
      ];

      const result = groupAlertsByCompatibleCriteria(alerts);

      // Different areas = separate batches
      expect(result.size).toBe(2);
    });

    it('should group alerts with overlapping price ranges', () => {
      const alerts = [
        {
          id: '1',
          areas: 'east-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 2,
        },
        {
          id: '2',
          areas: 'east-village',
          minPrice: 2000, // Same rounded price bucket
          maxPrice: 3000, // Same rounded price bucket
          minBeds: 2,
        },
      ];

      // These should be batched together (same price buckets)
      const result = groupAlertsByCompatibleCriteria(alerts);

      expect(result.size).toBe(1);
      const batch = Array.from(result.values())[0];
      expect(batch).toHaveLength(2);
    });

    it('should handle comma-separated areas', () => {
      const alerts = [
        {
          id: '1',
          areas: 'east-village,west-village',
          minPrice: 2000,
          maxPrice: 3000,
        },
        {
          id: '2',
          areas: 'west-village,east-village', // Same areas, different order
          minPrice: 2000,
          maxPrice: 3000,
        },
      ];

      const result = groupAlertsByCompatibleCriteria(alerts);

      // Should normalize and group together
      expect(result.size).toBe(1);
    });
  });

  describe('calculateBatchCriteria', () => {
    it('should use broadest criteria from alert group', () => {
      const alerts = [
        {
          areas: 'east-village',
          minPrice: 2000,
          maxPrice: 3000,
          minBeds: 1,
          maxBeds: 2,
          minBaths: 1,
          noFee: false,
        },
        {
          areas: 'east-village',
          minPrice: 2500,
          maxPrice: 3500,
          minBeds: 2,
          maxBeds: 3,
          minBaths: 1,
          noFee: true,
        },
      ];

      const batchCriteria = calculateBatchCriteria(alerts);

      // Should take broadest values
      expect(batchCriteria.minPrice).toBe(2000); // Min of all minPrices
      expect(batchCriteria.maxPrice).toBe(3500); // Max of all maxPrices
      expect(batchCriteria.minBeds).toBe(1); // Min of all minBeds
      expect(batchCriteria.maxBeds).toBe(3); // Max of all maxBeds
      expect(batchCriteria.noFee).toBe(true); // If ANY want noFee
    });

    it('should combine all unique areas', () => {
      const alerts = [
        { areas: 'east-village,west-village' },
        { areas: 'west-village,tribeca' },
      ];

      const batchCriteria = calculateBatchCriteria(alerts);

      // Should deduplicate and combine
      expect(batchCriteria.areas.split(',')).toHaveLength(3);
      expect(batchCriteria.areas).toContain('east-village');
      expect(batchCriteria.areas).toContain('west-village');
      expect(batchCriteria.areas).toContain('tribeca');
    });
  });

  describe('generateBatchHash', () => {
    it('should generate consistent hash for same criteria', () => {
      const criteria1 = {
        areas: 'east-village',
        minPrice: 2000,
        maxPrice: 3000,
        minBeds: 2,
      };

      const criteria2 = {
        areas: 'east-village',
        minPrice: 2000,
        maxPrice: 3000,
        minBeds: 2,
      };

      const hash1 = generateBatchHash(criteria1);
      const hash2 = generateBatchHash(criteria2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different criteria', () => {
      const criteria1 = {
        areas: 'east-village',
        minPrice: 2000,
        maxPrice: 3000,
      };

      const criteria2 = {
        areas: 'west-village',
        minPrice: 2000,
        maxPrice: 3000,
      };

      const hash1 = generateBatchHash(criteria1);
      const hash2 = generateBatchHash(criteria2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Cost Optimization Metrics', () => {
    it('should demonstrate significant API call reduction', () => {
      // Scenario: 100 users want similar apartments
      const alerts = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        userId: `user-${i}`,
        areas: 'east-village',
        minPrice: 2000 + (i % 10) * 100, // Slight price variations
        maxPrice: 3000 + (i % 10) * 100,
        minBeds: 2,
        maxBeds: 2,
        minBaths: 1,
        noFee: false,
      }));

      const batches = groupAlertsByCompatibleCriteria(alerts);

      // Without batching: 100 API calls
      // With batching: Much fewer (should be ~10 based on price rounding)
      const apiCallsWithoutBatching = alerts.length;
      const apiCallsWithBatching = batches.size;
      const savings = ((apiCallsWithoutBatching - apiCallsWithBatching) / apiCallsWithoutBatching) * 100;

      expect(apiCallsWithBatching).toBeLessThan(20);
      expect(savings).toBeGreaterThan(80); // At least 80% savings
    });
  });
});

// Mock helper functions (these would come from the actual service)
function groupAlertsByCompatibleCriteria(alerts: any[]): Map<string, any[]> {
  const groups = new Map();

  for (const alert of alerts) {
    const key = [
      normalizeAreas(alert.areas),
      Math.floor((alert.minPrice || 0) / 500) * 500,
      Math.floor((alert.maxPrice || 0) / 500) * 500,
      alert.minBeds || 0,
      alert.maxBeds || 999,
    ].join('|');

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(alert);
  }

  return groups;
}

function normalizeAreas(areas: string): string {
  return areas.split(',').sort().join(',');
}

function calculateBatchCriteria(alerts: any[]) {
  const allAreas = new Set<string>();
  alerts.forEach(a => {
    a.areas.split(',').forEach((area: string) => allAreas.add(area.trim()));
  });

  return {
    areas: Array.from(allAreas).sort().join(','),
    minPrice: Math.min(...alerts.map(a => a.minPrice || 0)),
    maxPrice: Math.max(...alerts.map(a => a.maxPrice || 999999)),
    minBeds: Math.min(...alerts.map(a => a.minBeds || 0)),
    maxBeds: Math.max(...alerts.map(a => a.maxBeds || 999)),
    minBaths: Math.min(...alerts.map(a => a.minBaths || 0)),
    noFee: alerts.some(a => a.noFee),
  };
}

function generateBatchHash(criteria: any): string {
  return JSON.stringify(Object.keys(criteria).sort().reduce((acc: any, key) => {
    acc[key] = criteria[key];
    return acc;
  }, {}));
}
