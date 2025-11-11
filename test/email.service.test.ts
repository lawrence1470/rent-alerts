/**
 * Email Service Tests
 *
 * Tests for the Resend email notification service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendEmail,
  sendBatchEmails,
  validateEmailAddress,
  isEmailEnabled,
  formatRentalNotificationEmail,
  generatePlainTextEmail,
  getErrorMessage,
  testEmailConfiguration,
  type EmailOptions,
} from '../lib/services/email.service';
import type { Listing, Alert } from '../lib/schema';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Resend SDK
vi.mock('resend', () => {
  const MockResend = vi.fn(function(this: any) {
    this.emails = {
      send: vi.fn().mockResolvedValue({
        data: { id: 'mock-message-id-123' },
      }),
    };
  });

  return {
    Resend: MockResend,
  };
});

// Mock React Email render
vi.mock('@react-email/components', () => ({
  render: vi.fn().mockReturnValue('<html>Mock Email HTML</html>'),
}));

// Mock email template
vi.mock('../lib/templates/rental-notification-email', () => ({
  default: vi.fn((props: any) => props),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockListing: Listing = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  address: '123 Main St, Apt 4B',
  neighborhood: 'East Village',
  price: 3200,
  bedrooms: 2,
  bathrooms: 1,
  title: 'Spacious 2BR in East Village',
  listingUrl: 'https://example.com/listing/123',
  noFee: true,
  sqft: 850,
  imageUrl: 'https://example.com/image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
  externalId: 'ext-123',
  rentStabilizedProbability: null,
  buildingId: null,
};

const mockAlert: Alert = {
  id: '456e7890-e89b-12d3-a456-426614174000',
  userId: 'user_123',
  name: 'East Village 2BR under $3500',
  areas: 'east-village',
  minPrice: null,
  maxPrice: 3500,
  minBeds: null,
  maxBeds: null,
  minBaths: null,
  noFee: false,
  filterRentStabilized: false,
  enablePhoneNotifications: false,
  enableEmailNotifications: true,
  preferredFrequency: '1hour',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastChecked: null,
};

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

describe('Email Validation', () => {
  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmailAddress('user@example.com')).toBe(true);
      expect(validateEmailAddress('test.user@domain.co.uk')).toBe(true);
      expect(validateEmailAddress('user+tag@example.com')).toBe(true);
      expect(validateEmailAddress('123@test.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmailAddress('invalid')).toBe(false);
      expect(validateEmailAddress('user@')).toBe(false);
      expect(validateEmailAddress('@example.com')).toBe(false);
      expect(validateEmailAddress('user @example.com')).toBe(false);
      expect(validateEmailAddress('')).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      expect(validateEmailAddress(null as any)).toBe(false);
      expect(validateEmailAddress(undefined as any)).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(validateEmailAddress('  user@example.com  ')).toBe(true);
    });

    it('should reject non-string inputs', () => {
      expect(validateEmailAddress(123 as any)).toBe(false);
      expect(validateEmailAddress({} as any)).toBe(false);
      expect(validateEmailAddress([] as any)).toBe(false);
    });
  });

  describe('isEmailEnabled', () => {
    const originalEnv = process.env.RESEND_API_KEY;

    afterEach(() => {
      process.env.RESEND_API_KEY = originalEnv;
    });

    it('should return true when API key is set', () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      expect(isEmailEnabled()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.RESEND_API_KEY;
      expect(isEmailEnabled()).toBe(false);
    });

    it('should return false when API key is empty string', () => {
      process.env.RESEND_API_KEY = '';
      expect(isEmailEnabled()).toBe(false);
    });
  });
});

// ============================================================================
// EMAIL SENDING TESTS
// ============================================================================

describe('Email Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RESEND_API_KEY = 're_test_key_123';
  });

  describe('sendEmail', () => {
    it('should send email successfully with valid options', async () => {
      const options: EmailOptions = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test Body</p>',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id-123');
      expect(result.error).toBeUndefined();
    });

    it('should fail when email service is not enabled', async () => {
      delete process.env.RESEND_API_KEY;

      const options: EmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should fail with invalid recipient email', async () => {
      const options: EmailOptions = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient email address');
    });

    it('should send email with all required parameters', async () => {
      const options: EmailOptions = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test Body</p>',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle custom from address', async () => {
      const options: EmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'Custom <custom@example.com>',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
    });
  });

  describe('sendBatchEmails', () => {
    it('should send multiple emails successfully', async () => {
      const emails: EmailOptions[] = [
        { to: 'user1@example.com', subject: 'Test 1', html: '<p>Test 1</p>' },
        { to: 'user2@example.com', subject: 'Test 2', html: '<p>Test 2</p>' },
        { to: 'user3@example.com', subject: 'Test 3', html: '<p>Test 3</p>' },
      ];

      const result = await sendBatchEmails(emails);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should track both successful and failed emails', async () => {
      const emails: EmailOptions[] = [
        { to: 'user1@example.com', subject: 'Test 1', html: '<p>Test 1</p>' },
        { to: 'invalid-email', subject: 'Test 2', html: '<p>Test 2</p>' }, // Will fail
        { to: 'user3@example.com', subject: 'Test 3', html: '<p>Test 3</p>' },
      ];

      const result = await sendBatchEmails(emails);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should handle empty batch', async () => {
      const result = await sendBatchEmails([]);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should add delay between emails', async () => {
      const startTime = Date.now();
      const emails: EmailOptions[] = [
        { to: 'user1@example.com', subject: 'Test 1', html: '<p>Test 1</p>' },
        { to: 'user2@example.com', subject: 'Test 2', html: '<p>Test 2</p>' },
      ];

      await sendBatchEmails(emails);

      const elapsedTime = Date.now() - startTime;
      // Should take at least 50ms (one delay between two emails)
      expect(elapsedTime).toBeGreaterThanOrEqual(50);
    });
  });
});

// ============================================================================
// EMAIL FORMATTING TESTS
// ============================================================================

describe('Email Formatting', () => {
  describe('formatRentalNotificationEmail', () => {
    it('should format rental notification email correctly', async () => {
      const { subject, html } = formatRentalNotificationEmail(mockListing, mockAlert);

      expect(subject).toContain('New Rental Match');
      expect(subject).toContain('2BR');
      expect(subject).toContain('East Village');
      expect(subject).toContain('$3,200');
      expect(html).toBeDefined();
      // HTML can be string or Promise depending on render implementation
      expect(html).toBeTruthy();
    });

    it('should handle listings with null bedrooms', () => {
      const listingNoBeds = { ...mockListing, bedrooms: null };
      const { subject, html } = formatRentalNotificationEmail(listingNoBeds, mockAlert);

      expect(subject).toBeDefined();
      expect(html).toBeDefined();
    });

    it('should generate correct subject line format', () => {
      const { subject } = formatRentalNotificationEmail(mockListing, mockAlert);

      expect(subject).toMatch(/New Rental Match: \d+BR in .+ - \$[\d,]+/);
    });

    it('should generate subject with price and neighborhood', () => {
      const { subject } = formatRentalNotificationEmail(mockListing, mockAlert);

      expect(subject).toContain(mockListing.neighborhood);
      expect(subject).toContain('$3,200');
      expect(subject).toContain('BR');
    });
  });

  describe('generatePlainTextEmail', () => {
    it('should generate plain text email correctly', () => {
      const plainText = generatePlainTextEmail(mockListing, mockAlert);

      expect(plainText).toContain('New Rental Match');
      expect(plainText).toContain(mockAlert.name);
      expect(plainText).toContain(mockListing.address);
      expect(plainText).toContain(mockListing.neighborhood);
      expect(plainText).toContain('$3,200');
      expect(plainText).toContain('2 Bedrooms');
      expect(plainText).toContain('1 Bathrooms');
      expect(plainText).toContain('No Fee');
      expect(plainText).toContain('850 sqft');
    });

    it('should show "Fee Required" for listings with fees', () => {
      const listingWithFee = { ...mockListing, noFee: false };
      const plainText = generatePlainTextEmail(listingWithFee, mockAlert);

      expect(plainText).toContain('Fee Required');
      expect(plainText).not.toContain('No Fee');
    });

    it('should omit sqft when not available', () => {
      const listingNoSqft = { ...mockListing, sqft: null };
      const plainText = generatePlainTextEmail(listingNoSqft, mockAlert);

      expect(plainText).not.toContain('sqft');
    });

    it('should include listing URL', () => {
      const plainText = generatePlainTextEmail(mockListing, mockAlert);

      expect(plainText).toContain(mockListing.listingUrl);
      expect(plainText).toContain('View listing:');
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  describe('getErrorMessage', () => {
    it('should map invalid_email error', () => {
      const error = new Error('invalid_email: Email format is incorrect');
      const message = getErrorMessage(error);

      expect(message).toBe('Invalid email address');
    });

    it('should map rate_limit error', () => {
      const error = new Error('rate_limit: Too many requests');
      const message = getErrorMessage(error);

      expect(message).toBe('Rate limit exceeded, please try again later');
    });

    it('should map invalid_api_key error', () => {
      const error = new Error('invalid_api_key: API key is invalid');
      const message = getErrorMessage(error);

      expect(message).toBe('Email service configuration error');
    });

    it('should map missing_required_field error', () => {
      const error = new Error('missing_required_field: Subject is required');
      const message = getErrorMessage(error);

      expect(message).toBe('Missing required email fields');
    });

    it('should return original message for unknown errors', () => {
      const error = new Error('Some other error');
      const message = getErrorMessage(error);

      expect(message).toBe('Some other error');
    });

    it('should handle non-Error objects', () => {
      const message = getErrorMessage('string error');

      expect(message).toBe('Unknown error occurred');
    });

    it('should handle null and undefined', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should be case-insensitive for error matching', () => {
      const error1 = new Error('INVALID_EMAIL: Error');
      const error2 = new Error('Invalid_Email: Error');

      expect(getErrorMessage(error1)).toBe('Invalid email address');
      expect(getErrorMessage(error2)).toBe('Invalid email address');
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RESEND_API_KEY = 're_test_key_123';
  });

  describe('testEmailConfiguration', () => {
    it('should send test email successfully', async () => {
      const result = await testEmailConfiguration('user@example.com');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const result = await testEmailConfiguration('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid test email address');
    });

    it('should return success for valid configuration', async () => {
      const result = await testEmailConfiguration('test@example.com');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.RESEND_API_KEY = 're_test_key_123';
  });

  it('should complete full email workflow for rental notification', async () => {
    // 1. Format the email
    const { subject, html } = formatRentalNotificationEmail(mockListing, mockAlert);

    expect(subject).toBeDefined();
    expect(html).toBeDefined();

    // 2. Validate recipient
    const isValid = validateEmailAddress('user@example.com');
    expect(isValid).toBe(true);

    // 3. Send the email
    const result = await sendEmail({
      to: 'user@example.com',
      subject,
      html,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should handle complete batch email workflow', async () => {
    const recipients = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ];

    // Format emails for each recipient
    const { subject, html } = formatRentalNotificationEmail(mockListing, mockAlert);

    const emails = recipients.map(to => ({
      to,
      subject,
      html,
    }));

    // Send batch
    const result = await sendBatchEmails(emails);

    expect(result.sent).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results.every(r => r.success)).toBe(true);
  });

  it('should gracefully handle configuration issues in workflow', async () => {
    // Disable email service
    delete process.env.RESEND_API_KEY;

    // Check if enabled
    const enabled = isEmailEnabled();
    expect(enabled).toBe(false);

    // Attempt to send (should fail gracefully)
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');
  });
});
