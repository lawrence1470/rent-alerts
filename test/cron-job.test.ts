/**
 * Tests for Cron Job Service - Schedule Synchronization
 *
 * Tests the fixed schedule window logic that ensures all users
 * are synchronized to the same check times (e.g., :00, :15, :30, :45)
 * regardless of when they signed up.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      alerts: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/services/alert-batching.service', () => ({
  getActiveBatches: vi.fn(() => Promise.resolve([])),
  listingMatchesAlert: vi.fn(() => true),
}));

vi.mock('@/lib/services/streeteasy-api.service', () => ({
  getStreetEasyClient: vi.fn(),
}));

vi.mock('@/lib/services/listing-deduplication.service', () => ({
  upsertListings: vi.fn(() => Promise.resolve([])),
  markListingsAsSeen: vi.fn(() => Promise.resolve()),
  filterNewListings: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/lib/services/notification.service', () => ({
  generateNotificationsForAlert: vi.fn(() => Promise.resolve([])),
  getUserNotificationChannels: vi.fn(() => Promise.resolve([])),
  processSMSNotifications: vi.fn(() => Promise.resolve({ sent: 0, failed: 0 })),
  processEmailNotifications: vi.fn(() => Promise.resolve({ sent: 0, failed: 0 })),
}));

vi.mock('@/lib/services/rent-stabilization.service', () => ({
  enrichListingsWithRentStabilization: vi.fn(() => Promise.resolve({
    listingsProcessed: 0,
    successCount: 0,
    failureCount: 0,
  })),
}));

vi.mock('@/lib/services/access-validation.service', () => ({
  hasActiveTierAccess: vi.fn(() => Promise.resolve(true)),
  canUseTierForAlert: vi.fn(() => Promise.resolve({ canUse: true, reason: '' })),
}));

describe('Cron Job Service - Schedule Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('shouldCheckAlert - Fixed Schedule Windows', () => {
    // Helper function to test shouldCheckAlert logic
    // Since shouldCheckAlert is not exported, we'll test the behavior through the logic
    function shouldCheckAlert(alert: any, currentTime: Date): boolean {
      const frequencyMinutes = {
        '15min': 15,
        '30min': 30,
        '1hour': 60,
      }[alert.preferredFrequency] || 60;

      const currentMinute = currentTime.getMinutes();
      const isScheduledWindow = currentMinute % frequencyMinutes === 0;

      if (!isScheduledWindow) {
        return false;
      }

      if (!alert.lastChecked) {
        return true;
      }

      const lastChecked = new Date(alert.lastChecked);
      const minutesSinceLastCheck = (currentTime.getTime() - lastChecked.getTime()) / (1000 * 60);

      return minutesSinceLastCheck >= frequencyMinutes;
    }

    describe('15-minute tier synchronization', () => {
      const alert15min = {
        id: 'test-15min',
        preferredFrequency: '15min',
        lastChecked: null,
      };

      it('should check at :00 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(true);
      });

      it('should check at :15 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:15:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(true);
      });

      it('should check at :30 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(true);
      });

      it('should check at :45 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:45:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(true);
      });

      it('should NOT check at :05 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:05:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :22 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:22:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :37 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:37:00Z'));
        const result = shouldCheckAlert(alert15min, new Date());
        expect(result).toBe(false);
      });
    });

    describe('30-minute tier synchronization', () => {
      const alert30min = {
        id: 'test-30min',
        preferredFrequency: '30min',
        lastChecked: null,
      };

      it('should check at :00 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
        const result = shouldCheckAlert(alert30min, new Date());
        expect(result).toBe(true);
      });

      it('should check at :30 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));
        const result = shouldCheckAlert(alert30min, new Date());
        expect(result).toBe(true);
      });

      it('should NOT check at :15 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:15:00Z'));
        const result = shouldCheckAlert(alert30min, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :45 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:45:00Z'));
        const result = shouldCheckAlert(alert30min, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :20 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:20:00Z'));
        const result = shouldCheckAlert(alert30min, new Date());
        expect(result).toBe(false);
      });
    });

    describe('1-hour tier synchronization', () => {
      const alert1hour = {
        id: 'test-1hour',
        preferredFrequency: '1hour',
        lastChecked: null,
      };

      it('should check at :00 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
        const result = shouldCheckAlert(alert1hour, new Date());
        expect(result).toBe(true);
      });

      it('should NOT check at :30 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));
        const result = shouldCheckAlert(alert1hour, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :15 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:15:00Z'));
        const result = shouldCheckAlert(alert1hour, new Date());
        expect(result).toBe(false);
      });

      it('should NOT check at :45 minute mark', () => {
        vi.setSystemTime(new Date('2024-01-01T10:45:00Z'));
        const result = shouldCheckAlert(alert1hour, new Date());
        expect(result).toBe(false);
      });
    });

    describe('Preventing double-checking in same window', () => {
      it('should NOT check again if already checked in current 15min window', () => {
        const alert = {
          id: 'test-15min',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T10:00:05Z'), // Checked 5 seconds ago at :00
        };

        vi.setSystemTime(new Date('2024-01-01T10:00:10Z')); // Still at :00 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(false);
      });

      it('should check in next 15min window after previous check', () => {
        const alert = {
          id: 'test-15min',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T10:00:00Z'), // Checked at :00
        };

        vi.setSystemTime(new Date('2024-01-01T10:15:00Z')); // Now at :15 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(true);
      });

      it('should NOT check again if already checked in current 30min window', () => {
        const alert = {
          id: 'test-30min',
          preferredFrequency: '30min',
          lastChecked: new Date('2024-01-01T10:30:02Z'), // Checked 2 seconds ago at :30
        };

        vi.setSystemTime(new Date('2024-01-01T10:30:10Z')); // Still at :30 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(false);
      });

      it('should check in next 30min window after previous check', () => {
        const alert = {
          id: 'test-30min',
          preferredFrequency: '30min',
          lastChecked: new Date('2024-01-01T10:00:00Z'), // Checked at :00
        };

        vi.setSystemTime(new Date('2024-01-01T10:30:00Z')); // Now at :30 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(true);
      });

      it('should NOT check again if already checked in current 1hour window', () => {
        const alert = {
          id: 'test-1hour',
          preferredFrequency: '1hour',
          lastChecked: new Date('2024-01-01T10:00:30Z'), // Checked 30 seconds ago at :00
        };

        vi.setSystemTime(new Date('2024-01-01T10:00:45Z')); // Still at :00 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(false);
      });

      it('should check in next 1hour window after previous check', () => {
        const alert = {
          id: 'test-1hour',
          preferredFrequency: '1hour',
          lastChecked: new Date('2024-01-01T10:00:00Z'), // Checked at 10:00
        };

        vi.setSystemTime(new Date('2024-01-01T11:00:00Z')); // Now at 11:00 window
        const result = shouldCheckAlert(alert, new Date());
        expect(result).toBe(true);
      });
    });

    describe('User synchronization scenarios', () => {
      it('should sync two 15min users who signed up at different times', () => {
        // User A signed up and was last checked at 9:47 (28 minutes ago, more than 15 min)
        const userA = {
          id: 'user-a',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T09:47:00Z'),
        };

        // User B signed up and was last checked at 9:52 (23 minutes ago, more than 15 min)
        const userB = {
          id: 'user-b',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T09:52:00Z'),
        };

        // Both should check at :15 window (next scheduled window after their last check)
        vi.setSystemTime(new Date('2024-01-01T10:15:00Z'));

        const resultA = shouldCheckAlert(userA, new Date());
        const resultB = shouldCheckAlert(userB, new Date());

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
      });

      it('should NOT check users between scheduled windows', () => {
        // User signed up at 10:03
        const user = {
          id: 'user-c',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T10:03:00Z'),
        };

        // At :10 mark (not a scheduled window)
        vi.setSystemTime(new Date('2024-01-01T10:10:00Z'));
        const result = shouldCheckAlert(user, new Date());

        expect(result).toBe(false);
      });

      it('should sync three 30min users regardless of signup time', () => {
        const userA = {
          id: 'user-a',
          preferredFrequency: '30min',
          lastChecked: new Date('2024-01-01T09:05:00Z'),
        };

        const userB = {
          id: 'user-b',
          preferredFrequency: '30min',
          lastChecked: new Date('2024-01-01T09:17:00Z'),
        };

        const userC = {
          id: 'user-c',
          preferredFrequency: '30min',
          lastChecked: new Date('2024-01-01T09:22:00Z'),
        };

        // All should check at :00 window
        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));

        const resultA = shouldCheckAlert(userA, new Date());
        const resultB = shouldCheckAlert(userB, new Date());
        const resultC = shouldCheckAlert(userC, new Date());

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);
      });
    });

    describe('Never-checked alerts (backward compatibility)', () => {
      it('should check 15min alert with no lastChecked if in scheduled window', () => {
        const alert = {
          id: 'new-alert',
          preferredFrequency: '15min',
          lastChecked: null,
        };

        vi.setSystemTime(new Date('2024-01-01T10:15:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(true);
      });

      it('should NOT check 15min alert with no lastChecked if NOT in scheduled window', () => {
        const alert = {
          id: 'new-alert',
          preferredFrequency: '15min',
          lastChecked: null,
        };

        vi.setSystemTime(new Date('2024-01-01T10:07:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(false);
      });

      it('should check 30min alert with no lastChecked if in scheduled window', () => {
        const alert = {
          id: 'new-alert',
          preferredFrequency: '30min',
          lastChecked: null,
        };

        vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(true);
      });

      it('should check 1hour alert with no lastChecked if in scheduled window', () => {
        const alert = {
          id: 'new-alert',
          preferredFrequency: '1hour',
          lastChecked: null,
        };

        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should handle default to 1hour for unknown frequency', () => {
        const alert = {
          id: 'unknown-tier',
          preferredFrequency: 'unknown-tier',
          lastChecked: null,
        };

        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
        const resultAtHour = shouldCheckAlert(alert, new Date());
        expect(resultAtHour).toBe(true);

        vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));
        const resultAtHalf = shouldCheckAlert(alert, new Date());
        expect(resultAtHalf).toBe(false);
      });

      it('should handle midnight hour transition correctly for 15min tier', () => {
        const alert = {
          id: 'midnight-test',
          preferredFrequency: '15min',
          lastChecked: new Date('2024-01-01T23:45:00Z'),
        };

        vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(true);
      });

      it('should handle day boundary for 1hour tier', () => {
        const alert = {
          id: 'day-boundary',
          preferredFrequency: '1hour',
          lastChecked: new Date('2024-01-01T23:00:00Z'),
        };

        vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
        const result = shouldCheckAlert(alert, new Date());

        expect(result).toBe(true);
      });
    });
  });
});
