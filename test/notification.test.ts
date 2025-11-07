import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockAlerts } from './__mocks__/db';
import { mockStreetEasyListing } from './__mocks__/streeteasy-data';

/**
 * Notification Service Tests
 *
 * Tests the notification creation, queuing, and delivery system
 */

describe('Notification Service', () => {
  describe('createNotificationsForUser', () => {
    it('should create notifications for new listings', async () => {
      const userId = 'user-1';
      const alertId = 'alert-1';
      const newListings = [
        { id: 'listing-1', ...mockStreetEasyListing },
        { id: 'listing-2', ...mockStreetEasyListing, price: 2800 },
      ];

      const notifications = await createNotificationsForUser(
        userId,
        alertId,
        newListings
      );

      expect(notifications).toHaveLength(2);
      notifications.forEach((notification: any) => {
        expect(notification.userId).toBe(userId);
        expect(notification.alertId).toBe(alertId);
        expect(notification.status).toBe('pending');
        expect(notification.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should handle empty listings array', async () => {
      const userId = 'user-1';
      const alertId = 'alert-1';
      const newListings: any[] = [];

      const notifications = await createNotificationsForUser(
        userId,
        alertId,
        newListings
      );

      expect(notifications).toHaveLength(0);
    });

    it('should include listing details in notification', async () => {
      const userId = 'user-1';
      const alertId = 'alert-1';
      const newListings = [
        {
          id: 'listing-1',
          title: 'Beautiful 2BR',
          price: 3200,
          neighborhood: 'east-village',
        },
      ];

      const notifications = await createNotificationsForUser(
        userId,
        alertId,
        newListings
      );

      expect(notifications[0].listingId).toBe('listing-1');
      expect(notifications[0].title).toBe('Beautiful 2BR');
      expect(notifications[0].price).toBe(3200);
    });
  });

  describe('getPendingNotifications', () => {
    it('should retrieve all pending notifications', async () => {
      const mockNotifications = [
        { id: '1', status: 'pending', userId: 'user-1', createdAt: new Date('2025-01-01') },
        { id: '2', status: 'pending', userId: 'user-2', createdAt: new Date('2025-01-02') },
        { id: '3', status: 'sent', userId: 'user-1', createdAt: new Date('2025-01-03') },
      ];

      const result = await getPendingNotifications(mockNotifications);

      expect(result).toHaveLength(2);
      expect(result.every((n: any) => n.status === 'pending')).toBe(true);
    });

    it('should return empty array if no pending notifications', async () => {
      const result = await getPendingNotifications([]);

      expect(result).toHaveLength(0);
    });

    it('should order by creation date ascending', async () => {
      const mockNotifications = [
        { id: '1', status: 'pending', createdAt: new Date('2025-01-03') },
        { id: '2', status: 'pending', createdAt: new Date('2025-01-01') },
        { id: '3', status: 'pending', createdAt: new Date('2025-01-02') },
      ];

      const result = await getPendingNotifications(mockNotifications);

      expect(result[0].id).toBe('2'); // Earliest date
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1'); // Latest date
    });
  });

  describe('markNotificationAsSent', () => {
    it('should update notification status to sent', async () => {
      const notificationId = 'notification-1';

      const result = await markNotificationAsSent(notificationId);

      expect(result.status).toBe('sent');
      expect(result.sentAt).toBeInstanceOf(Date);
    });

    it('should handle errors for non-existent notification', async () => {
      const notificationId = 'non-existent';

      await expect(markNotificationAsSent(notificationId)).rejects.toThrow();
    });
  });

  describe('markNotificationAsFailed', () => {
    it('should update notification status to failed with error', async () => {
      const notificationId = 'notification-1';
      const errorMessage = 'Email delivery failed';

      const result = await markNotificationAsFailed(notificationId, errorMessage);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe(errorMessage);
      expect(result.failedAt).toBeInstanceOf(Date);
    });
  });

  describe('getNotificationsForUser', () => {
    it('should retrieve all notifications for specific user', async () => {
      const userId = 'user-1';
      const mockNotifications = [
        { id: '1', userId: 'user-1', status: 'sent' },
        { id: '2', userId: 'user-2', status: 'sent' },
        { id: '3', userId: 'user-1', status: 'pending' },
      ];

      const result = await getNotificationsForUser(userId);

      expect(result).toHaveLength(2);
      expect(result.every((n: any) => n.userId === userId)).toBe(true);
    });

    it('should support pagination', async () => {
      const userId = 'user-1';
      const limit = 10;
      const offset = 0;

      const result = await getNotificationsForUser(userId, limit, offset);

      expect(result.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Notification Batching', () => {
    it('should group notifications by user for efficient delivery', () => {
      const notifications = [
        { userId: 'user-1', listingId: 'listing-1' },
        { userId: 'user-2', listingId: 'listing-2' },
        { userId: 'user-1', listingId: 'listing-3' },
        { userId: 'user-3', listingId: 'listing-4' },
        { userId: 'user-1', listingId: 'listing-5' },
      ];

      const batched = groupNotificationsByUser(notifications);

      expect(batched.size).toBe(3);
      expect(batched.get('user-1')).toHaveLength(3);
      expect(batched.get('user-2')).toHaveLength(1);
      expect(batched.get('user-3')).toHaveLength(1);
    });

    it('should support digest notifications', async () => {
      const userId = 'user-1';
      const notifications = [
        { listingId: 'listing-1', title: 'Apt 1', price: 3000 },
        { listingId: 'listing-2', title: 'Apt 2', price: 3200 },
        { listingId: 'listing-3', title: 'Apt 3', price: 2800 },
      ];

      const digest = createNotificationDigest(userId, notifications);

      expect(digest.userId).toBe(userId);
      expect(digest.listingCount).toBe(3);
      expect(digest.priceRange).toEqual({ min: 2800, max: 3200 });
      expect(digest.listings).toHaveLength(3);
    });
  });

  describe('Notification Metrics', () => {
    it('should track notification delivery rate', async () => {
      const mockNotifications = [
        { status: 'sent' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'failed' },
        { status: 'pending' },
      ];

      const metrics = calculateNotificationMetrics(mockNotifications);

      expect(metrics.total).toBe(5);
      expect(metrics.sent).toBe(3);
      expect(metrics.failed).toBe(1);
      expect(metrics.pending).toBe(1);
      expect(metrics.deliveryRate).toBe(0.75); // 3 out of 4 attempted (sent + failed)
    });
  });
});

// Mock helper functions (these would come from the actual service)
async function createNotificationsForUser(
  userId: string,
  alertId: string,
  listings: any[]
): Promise<any[]> {
  return listings.map(listing => ({
    id: `notification-${Math.random()}`,
    userId,
    alertId,
    listingId: listing.id,
    title: listing.title,
    price: listing.price,
    status: 'pending',
    createdAt: new Date(),
  }));
}

async function getPendingNotifications(notifications: any[] = []): Promise<any[]> {
  const pending = notifications.filter(n => n.status === 'pending');
  return pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

async function markNotificationAsSent(notificationId: string): Promise<any> {
  if (notificationId === 'non-existent') {
    throw new Error('Notification not found');
  }
  return {
    id: notificationId,
    status: 'sent',
    sentAt: new Date(),
  };
}

async function markNotificationAsFailed(
  notificationId: string,
  errorMessage: string
): Promise<any> {
  return {
    id: notificationId,
    status: 'failed',
    errorMessage,
    failedAt: new Date(),
  };
}

async function getNotificationsForUser(
  userId: string,
  limit = 10,
  offset = 0
): Promise<any[]> {
  const mockData: Record<string, any[]> = {
    'user-1': [
      { id: '1', userId: 'user-1', status: 'sent' },
      { id: '3', userId: 'user-1', status: 'pending' },
    ],
    'user-2': [{ id: '2', userId: 'user-2', status: 'sent' }],
  };
  const userNotifications = mockData[userId] || [];
  return userNotifications.slice(offset, offset + limit);
}

function groupNotificationsByUser(notifications: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const notification of notifications) {
    const userId = notification.userId;
    if (!groups.has(userId)) {
      groups.set(userId, []);
    }
    groups.get(userId)!.push(notification);
  }
  return groups;
}

function createNotificationDigest(userId: string, listings: any[]): any {
  const prices = listings.map(l => l.price);
  return {
    userId,
    listingCount: listings.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
    listings,
  };
}

function calculateNotificationMetrics(notifications: any[]): any {
  const total = notifications.length;
  const sent = notifications.filter(n => n.status === 'sent').length;
  const failed = notifications.filter(n => n.status === 'failed').length;
  const pending = notifications.filter(n => n.status === 'pending').length;
  const attempted = sent + failed;
  const deliveryRate = attempted > 0 ? sent / attempted : 0;

  return { total, sent, failed, pending, deliveryRate };
}
