/**
 * Notification Service SMS Integration Tests
 *
 * Tests for SMS notification processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createNotification,
  processSMSNotifications,
  getUserNotificationChannels,
  generateNotificationsForAlert,
  type NotificationData,
} from '@/lib/services/notification.service';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    query: {
      notifications: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(() => Promise.resolve({
          id: 'user_123',
          email: 'test@example.com',
          phoneNumber: '+14155552671',
        })),
      },
    },
  },
}));

vi.mock('@/lib/services/sms.service', () => ({
  sendSMS: vi.fn(),
  formatRentalNotificationSMS: vi.fn(() => 'Formatted SMS message'),
  isSMSEnabled: vi.fn(() => true),
}));

// ============================================================================
// Test Data
// ============================================================================

const mockAlert = {
  id: 'alert_123',
  userId: 'user_123',
  name: 'Test Alert',
  areas: 'east-village',
  minPrice: 2000,
  maxPrice: 4000,
  minBeds: 2,
  maxBeds: null,
  minBaths: null,
  noFee: false,
  filterRentStabilized: false,
  enablePhoneNotifications: true,
  enableEmailNotifications: true,
  preferredFrequency: '30min',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastChecked: null,
};

const mockListing = {
  id: 'listing_123',
  streetEasyId: 'se_123',
  title: 'Beautiful 2BR Apartment',
  address: '123 Main St, Apt 4B',
  neighborhood: 'East Village',
  price: 3500,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 900,
  noFee: false,
  listingUrl: 'https://example.com/listing/123',
  imageUrl: 'https://example.com/image.jpg',
  latitude: null,
  longitude: null,
  rentStabilizedStatus: 'unknown',
  rentStabilizedProbability: null,
  rentStabilizedSource: null,
  rentStabilizedCheckedAt: null,
  buildingDhcrId: null,
  rawData: null,
  firstSeenAt: new Date(),
  lastSeenAt: new Date(),
  isActive: true,
};

const mockNotification = {
  id: 'notif_123',
  userId: 'user_123',
  alertId: 'alert_123',
  listingId: 'listing_123',
  channel: 'sms' as const,
  status: 'pending' as const,
  subject: null,
  body: 'Test SMS message',
  phoneNumber: '+14155552671',
  twilioMessageSid: null,
  errorMessage: null,
  attemptCount: 0,
  createdAt: new Date(),
  sentAt: null,
};

// ============================================================================
// Notification Creation Tests
// ============================================================================

describe('SMS Notification Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates SMS notification with phone number', async () => {
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockNotification])),
        })),
      }));

      (db.insert as any) = mockInsert;

      const notificationData: NotificationData = {
        userId: 'user_123',
        alertId: 'alert_123',
        listingId: 'listing_123',
        channel: 'sms',
        body: 'Test message',
        phoneNumber: '+14155552671',
      };

      const result = await createNotification(notificationData);

      expect(result).toBeDefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('includes twilioMessageSid in notification', async () => {
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            ...mockNotification,
            twilioMessageSid: 'SM123',
          }])),
        })),
      }));

      (db.insert as any) = mockInsert;

      const notificationData: NotificationData = {
        userId: 'user_123',
        alertId: 'alert_123',
        listingId: 'listing_123',
        channel: 'sms',
        body: 'Test message',
        phoneNumber: '+14155552671',
        twilioMessageSid: 'SM123',
      };

      const result = await createNotification(notificationData);

      expect(result).toBeDefined();
    });
  });

  describe('getUserNotificationChannels', () => {
    it('includes SMS when enablePhoneNotifications is true and user has phone', async () => {
      const channels = await getUserNotificationChannels(mockAlert);

      expect(channels).toContain('in_app');
      expect(channels).toContain('email');
      expect(channels).toContain('sms');
    });

    it('excludes SMS when enablePhoneNotifications is false', async () => {
      const alertNoSMS = { ...mockAlert, enablePhoneNotifications: false };
      const channels = await getUserNotificationChannels(alertNoSMS);

      expect(channels).toContain('in_app');
      expect(channels).toContain('email');
      expect(channels).not.toContain('sms');
    });

    it('excludes email when enableEmailNotifications is false', async () => {
      const alertNoEmail = { ...mockAlert, enableEmailNotifications: false };
      const channels = await getUserNotificationChannels(alertNoEmail);

      expect(channels).toContain('in_app');
      expect(channels).not.toContain('email');
      expect(channels).toContain('sms');
    });

    it('always includes in_app channel', async () => {
      const alertNoNotifications = {
        ...mockAlert,
        enablePhoneNotifications: false,
        enableEmailNotifications: false,
      };
      const channels = await getUserNotificationChannels(alertNoNotifications);

      expect(channels).toContain('in_app');
      expect(channels).toHaveLength(1);
    });
  });
});

// ============================================================================
// SMS Processing Tests
// ============================================================================

describe('SMS Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processSMSNotifications', () => {
    it('processes pending SMS notifications successfully', async () => {
      const { sendSMS } = await import('@/lib/services/sms.service');

      // Mock database response
      (db.query.notifications.findMany as any).mockResolvedValue([mockNotification]);

      // Mock successful SMS send
      (sendSMS as any).mockResolvedValue({
        success: true,
        messageSid: 'SM123',
        status: 'queued',
      });

      // Mock database update
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      (db.update as any) = mockUpdate;

      const result = await processSMSNotifications();

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(sendSMS).toHaveBeenCalledWith({
        to: '+14155552671',
        body: 'Test SMS message',
      });
    });

    it('handles SMS send failures', async () => {
      const { sendSMS } = await import('@/lib/services/sms.service');

      // Mock database response
      (db.query.notifications.findMany as any).mockResolvedValue([mockNotification]);

      // Mock failed SMS send
      (sendSMS as any).mockResolvedValue({
        success: false,
        error: 'Invalid phone number',
      });

      // Mock database update
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      (db.update as any) = mockUpdate;

      const result = await processSMSNotifications();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('handles missing phone number', async () => {
      const notificationNoPhone = { ...mockNotification, phoneNumber: null };

      // Mock database response
      (db.query.notifications.findMany as any).mockResolvedValue([notificationNoPhone]);

      // Mock database update
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      (db.update as any) = mockUpdate;

      const result = await processSMSNotifications();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('returns early when SMS is disabled', async () => {
      const { isSMSEnabled } = await import('@/lib/services/sms.service');

      // Mock SMS disabled
      (isSMSEnabled as any).mockReturnValue(false);

      const result = await processSMSNotifications();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('processes multiple notifications in batch', async () => {
      const { sendSMS, isSMSEnabled } = await import('@/lib/services/sms.service');

      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif_124', phoneNumber: '+14155552672' },
        { ...mockNotification, id: 'notif_125', phoneNumber: '+14155552673' },
      ];

      // Mock SMS enabled
      (isSMSEnabled as any).mockReturnValue(true);

      // Mock database response
      (db.query.notifications.findMany as any).mockResolvedValue(notifications);

      // Mock successful SMS sends
      (sendSMS as any).mockResolvedValue({
        success: true,
        messageSid: 'SM123',
        status: 'queued',
      });

      // Mock database update
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      (db.update as any) = mockUpdate;

      const result = await processSMSNotifications();

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(sendSMS).toHaveBeenCalledTimes(3);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('SMS Notification Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('complete workflow: generate SMS notification and process', async () => {
    const { formatRentalNotificationSMS } = await import('@/lib/services/sms.service');

    // Mock bulk insert
    const mockInsert = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockNotification])),
      })),
    }));
    (db.insert as any) = mockInsert;

    // Generate notifications
    const notifications = await generateNotificationsForAlert(
      mockAlert,
      [mockListing],
      'sms'
    );

    expect(notifications).toHaveLength(1);
    expect(formatRentalNotificationSMS).toHaveBeenCalled();
  });
});
