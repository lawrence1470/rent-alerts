/**
 * Tests for Clerk Webhook Handler
 *
 * Tests user sync from Clerk to local database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/clerk/route';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Mock Svix webhook verification
vi.mock('svix', () => {
  return {
    Webhook: class {
      constructor(secret: string) {}
      verify(body: string, headers: any) {
        // Return parsed body if headers are valid
        if (headers['svix-id'] && headers['svix-timestamp'] && headers['svix-signature']) {
          return JSON.parse(body);
        }
        throw new Error('Invalid signature');
      }
    },
  };
});

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock headers - must return a Promise
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([
    ['svix-id', 'test-id'],
    ['svix-timestamp', '1234567890'],
    ['svix-signature', 'test-signature'],
  ])),
}));

describe('Clerk Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set webhook secret
    process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';
  });

  describe('POST /api/webhooks/clerk', () => {
    describe('Security & Validation', () => {
      it('should reject requests without webhook secret configured', async () => {
        delete process.env.CLERK_WEBHOOK_SECRET;

        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_123',
            email_addresses: [{ id: 'email_1', email_address: 'test@example.com' }],
            primary_email_address_id: 'email_1',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Webhook secret not configured');
      });

      it('should reject requests with invalid signature', async () => {
        // Mock headers to return null for signature
        const { headers } = await import('next/headers');
        vi.mocked(headers).mockResolvedValueOnce(new Map([
          ['svix-id', 'test-id'],
          ['svix-timestamp', '1234567890'],
          // Missing svix-signature
        ]));

        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_123',
            email_addresses: [{ id: 'email_1', email_address: 'test@example.com' }],
            primary_email_address_id: 'email_1',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing webhook headers');
      });
    });

    describe('user.created event', () => {
      it('should create new user with email', async () => {
        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_123',
            email_addresses: [
              { id: 'email_1', email_address: 'test@example.com' },
            ],
            primary_email_address_id: 'email_1',
            phone_numbers: [],
            first_name: 'John',
            last_name: 'Doe',
            image_url: 'https://example.com/avatar.jpg',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.insert).toHaveBeenCalledWith(users);
      });

      it('should create user with phone number if provided', async () => {
        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_456',
            email_addresses: [
              { id: 'email_1', email_address: 'john@example.com' },
            ],
            primary_email_address_id: 'email_1',
            phone_numbers: [
              { id: 'phone_1', phone_number: '+12025551234' },
            ],
            primary_phone_number_id: 'phone_1',
            first_name: 'John',
            last_name: 'Doe',
            image_url: null,
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should reject user creation without email', async () => {
        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_789',
            email_addresses: [],
            phone_numbers: [],
            first_name: null,
            last_name: null,
            image_url: null,
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('User email required');
      });
    });

    describe('user.updated event', () => {
      it('should update existing user data', async () => {
        const mockEvent = {
          type: 'user.updated',
          data: {
            id: 'user_123',
            email_addresses: [
              { id: 'email_2', email_address: 'updated@example.com' },
            ],
            primary_email_address_id: 'email_2',
            phone_numbers: [
              { id: 'phone_1', phone_number: '+12025559999' },
            ],
            primary_phone_number_id: 'phone_1',
            first_name: 'Jane',
            last_name: 'Smith',
            image_url: 'https://example.com/new-avatar.jpg',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.insert).toHaveBeenCalledWith(users);
      });

      it('should handle phone number removal', async () => {
        const mockEvent = {
          type: 'user.updated',
          data: {
            id: 'user_456',
            email_addresses: [
              { id: 'email_1', email_address: 'test@example.com' },
            ],
            primary_email_address_id: 'email_1',
            phone_numbers: [], // Phone removed
            primary_phone_number_id: null,
            first_name: 'John',
            last_name: 'Doe',
            image_url: null,
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('user.deleted event', () => {
      it('should delete user from database', async () => {
        const mockEvent = {
          type: 'user.deleted',
          data: {
            id: 'user_123',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.delete).toHaveBeenCalledWith(users);
      });

      it('should reject deletion without user ID', async () => {
        const mockEvent = {
          type: 'user.deleted',
          data: {
            id: null,
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('User ID required');
      });
    });

    describe('Unhandled events', () => {
      it('should log but not error on unknown event types', async () => {
        const mockEvent = {
          type: 'user.session.created',
          data: {
            id: 'session_123',
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        vi.mocked(db.insert).mockImplementationOnce(() => {
          throw new Error('Database connection failed');
        });

        const mockEvent = {
          type: 'user.created',
          data: {
            id: 'user_123',
            email_addresses: [
              { id: 'email_1', email_address: 'test@example.com' },
            ],
            primary_email_address_id: 'email_1',
            phone_numbers: [],
          },
        };

        const req = new Request('http://localhost:3000/api/webhooks/clerk', {
          method: 'POST',
          body: JSON.stringify(mockEvent),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Internal server error');
      });
    });
  });
});
