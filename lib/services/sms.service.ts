/**
 * SMS Service - Twilio Integration
 *
 * Handles SMS notifications via Twilio API with comprehensive error handling,
 * rate limiting awareness, and phone number validation.
 */

import twilio from 'twilio';
import type { Listing } from '@/lib/schema';

// ============================================================================
// Twilio Client Initialization
// ============================================================================

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate environment variables
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('⚠️  Twilio environment variables not configured. SMS notifications will be disabled.');
}

// Initialize Twilio client (singleton pattern)
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

// ============================================================================
// Type Definitions
// ============================================================================

export interface SendSMSParams {
  to: string; // Recipient phone number (E.164 format)
  body: string; // Message content
  statusCallback?: string; // Optional webhook for delivery status
}

export interface SMSResponse {
  success: boolean;
  messageSid?: string; // Twilio message identifier
  error?: string;
  status?: string; // queued, sending, sent, failed, delivered
}

export interface RentalListingForSMS {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  url: string;
  neighborhood?: string;
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate E.164 phone number format
 * Format: +[country code][number] (e.g., +14155552671)
 * Max 15 digits total
 */
export function isValidE164(phoneNumber: string): boolean {
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phoneNumber);
}

/**
 * Format user input to E.164 format
 * Assumes US numbers if no country code provided
 */
export function formatToE164(input: string): string {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Add +1 for US if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code or invalid length
  return `+${digits}`;
}

/**
 * Validate and format phone number using Twilio Lookup API (FREE)
 * @param phoneNumber - Raw phone number in any format
 * @returns Formatted E.164 number or null if invalid
 */
export async function validateAndFormatPhoneNumber(
  phoneNumber: string
): Promise<{ valid: boolean; e164?: string; error?: string }> {
  if (!twilioClient) {
    return {
      valid: false,
      error: 'Twilio client not configured',
    };
  }

  try {
    // Lookup API - basic validation is FREE
    const lookup = await twilioClient.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch();

    return {
      valid: lookup.valid,
      e164: lookup.phoneNumber,
    };
  } catch (error: unknown) {
    console.error('Phone validation error:', error);
    return {
      valid: false,
      error: 'Invalid phone number',
    };
  }
}

// ============================================================================
// SMS Sending Functions
// ============================================================================

/**
 * Send SMS via Twilio
 * @param params - SMS parameters
 * @returns Promise<SMSResponse>
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  const { to, body, statusCallback } = params;

  // Check if Twilio is configured
  if (!twilioClient || !twilioPhoneNumber) {
    return {
      success: false,
      error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
    };
  }

  // Validate phone number format
  if (!isValidE164(to)) {
    return {
      success: false,
      error: 'Invalid phone number format. Must be E.164 format (e.g., +15551234567)',
    };
  }

  // Validate message body
  if (!body || body.trim().length === 0) {
    return {
      success: false,
      error: 'Message body cannot be empty',
    };
  }

  // Check message length (160 GSM-7 chars = 1 segment, 70 UCS-2 chars = 1 segment)
  // Messages longer than this are automatically segmented
  const segments = Math.ceil(body.length / 160);
  if (segments > 10) {
    console.warn(`⚠️  Message is ${segments} segments long. Consider shortening.`);
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
      ...(statusCallback && { statusCallback }), // Optional delivery tracking
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error: unknown) {
    const twilioError = error as { code?: number; message?: string; status?: number };

    console.error('Twilio SMS error:', {
      code: twilioError.code,
      message: twilioError.message,
      status: twilioError.status,
      to,
    });

    // Map common Twilio error codes to user-friendly messages
    const errorMessage = mapTwilioError(twilioError.code);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send SMS to multiple recipients (batch)
 * Implements conservative rate limiting to avoid Twilio limits
 *
 * @param recipients - Array of phone numbers
 * @param body - Message content
 * @returns Promise<SMSResponse[]>
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string
): Promise<SMSResponse[]> {
  // Send messages in parallel with rate limiting awareness
  const batchSize = 10; // Conservative batch size
  const results: SMSResponse[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((to) => sendSMS({ to, body }))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    // Twilio long codes: 1 msg/sec, toll-free: 3 msg/sec
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Format rental notification message for SMS
 * Optimized to stay within 160 characters (1 SMS segment) when possible
 */
export function formatRentalNotificationSMS(listing: RentalListingForSMS): string {
  const neighborhood = listing.neighborhood ? ` in ${listing.neighborhood}` : '';

  // Shortened format to stay within 160 chars
  return `New rental${neighborhood}!
${listing.address}
$${listing.price.toLocaleString()}/mo | ${listing.bedrooms}bd ${listing.bathrooms}ba

View: ${listing.url}`;
}

/**
 * Format multiple rental notifications into a single SMS
 * Used for digest/batch notifications
 */
export function formatMultipleRentalsSMS(
  listings: RentalListingForSMS[],
  alertName: string,
  viewAllUrl: string
): string {
  const count = listings.length;

  if (count === 1) {
    return formatRentalNotificationSMS(listings[0]);
  }

  // For multiple listings, provide summary
  const priceRange = {
    min: Math.min(...listings.map(l => l.price)),
    max: Math.max(...listings.map(l => l.price)),
  };

  return `${count} new rentals for "${alertName}"

Price range: $${priceRange.min.toLocaleString()}-$${priceRange.max.toLocaleString()}/mo
Bedrooms: ${Math.min(...listings.map(l => l.bedrooms))}-${Math.max(...listings.map(l => l.bedrooms))}bd

View all: ${viewAllUrl}`;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map Twilio error codes to user-friendly messages
 */
function mapTwilioError(code: number | undefined): string {
  const errorMap: Record<number, string> = {
    21211: 'Invalid phone number',
    21408: 'Permission denied to send to this number',
    21610: 'Message blocked by carrier',
    21614: 'Invalid mobile number',
    21608: 'Number not verified (trial account restriction)',
    14107: 'Rate limit exceeded. Please try again later.',
    21611: 'Message queue full for this number',
    20429: 'Too many concurrent requests',
  };

  return errorMap[code || 0] || 'Failed to send SMS. Please try again.';
}

// ============================================================================
// Testing & Verification
// ============================================================================

/**
 * Test Twilio connection
 * Useful for health checks and debugging
 */
export async function testTwilioConnection(): Promise<{
  success: boolean;
  message: string;
  accountSid?: string;
  phoneNumber?: string;
}> {
  if (!twilioClient || !accountSid || !twilioPhoneNumber) {
    return {
      success: false,
      message: 'Twilio environment variables not configured',
    };
  }

  try {
    // Fetch account info to verify credentials
    const account = await twilioClient.api.accounts(accountSid).fetch();

    return {
      success: true,
      message: 'Twilio connection successful',
      accountSid: account.sid,
      phoneNumber: twilioPhoneNumber,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      message: `Twilio connection failed: ${err.message || 'Unknown error'}`,
    };
  }
}

/**
 * Check if SMS notifications are enabled (environment configured)
 */
export function isSMSEnabled(): boolean {
  return !!(twilioClient && accountSid && authToken && twilioPhoneNumber);
}
