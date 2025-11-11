/**
 * Email Service
 *
 * Handles sending emails via Resend API
 * Provides email formatting, validation, and delivery
 */

import { Resend } from 'resend';
import type { Listing, Alert } from '../schema';
import RentalNotificationEmail from '../templates/rental-notification-email';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface RentalEmailData {
  listing: {
    address: string;
    price: number;
    bedrooms?: string | number;
    bathrooms?: number;
    url?: string;
    neighborhood?: string;
    title?: string;
    imageUrl?: string;
    noFee?: boolean;
    sqft?: number;
  };
  alert: {
    name: string;
  };
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let resendClient: Resend | null = null;

/**
 * Gets or creates the Resend client instance
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Checks if email service is properly configured
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validates email address format
 * Uses a simple but effective regex pattern
 */
export function validateEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

/**
 * Sends a single email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Check if email is enabled
    if (!isEmailEnabled()) {
      console.warn('Email service not enabled - RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Validate recipient email
    if (!validateEmailAddress(options.to)) {
      return {
        success: false,
        error: 'Invalid recipient email address',
      };
    }

    // Get Resend client
    const resend = getResendClient();

    // Default from address (use env var or fallback to test domain)
    const defaultFrom = process.env.RESEND_FROM_EMAIL
      ? `Rent Notifications <${process.env.RESEND_FROM_EMAIL}>`
      : 'Rent Notifications <onboarding@resend.dev>';

    const fromAddress = options.from || defaultFrom;

    // Send email
    const response = await resend.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Check for errors in response
    if ('error' in response && response.error) {
      console.error('Resend API error:', response.error);
      return {
        success: false,
        error: response.error?.message || 'Failed to send email',
      };
    }

    // Success
    return {
      success: true,
      messageId: 'data' in response ? response.data?.id : undefined,
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Sends multiple emails in batch
 * Note: Resend has rate limits, so this sends sequentially with a small delay
 */
export async function sendBatchEmails(emails: EmailOptions[]): Promise<{
  sent: number;
  failed: number;
  results: EmailResult[];
}> {
  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting (50ms between emails)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { sent, failed, results };
}

// ============================================================================
// EMAIL FORMATTING
// ============================================================================

/**
 * Formats a rental notification email using React Email template
 */
export function formatRentalNotificationEmail(
  listing: Listing,
  alert: Alert
): { subject: string; html: string } {
  // Create email data object
  const emailData: RentalEmailData = {
    listing: {
      address: listing.address,
      price: listing.price,
      bedrooms: listing.bedrooms?.toString() || '0',
      bathrooms: listing.bathrooms || 0,
      url: listing.listingUrl,
      neighborhood: listing.neighborhood,
      title: listing.title,
      imageUrl: listing.imageUrl || undefined,
      noFee: listing.noFee || false,
      sqft: listing.sqft || undefined,
    },
    alert: {
      name: alert.name,
    },
  };

  // Generate subject line
  const subject = `New Rental Match: ${listing.bedrooms}BR in ${listing.neighborhood} - $${listing.price.toLocaleString()}`;

  // Import and render React Email component
  const { render } = require('@react-email/components');
  const html = render(RentalNotificationEmail(emailData));

  return { subject, html };
}

/**
 * Generates a simple plain text version of the email
 * Used as fallback for email clients that don't support HTML
 */
export function generatePlainTextEmail(
  listing: Listing,
  alert: Alert
): string {
  const feeText = listing.noFee ? 'No Fee' : 'Fee Required';
  const sqftText = listing.sqft ? ` • ${listing.sqft.toLocaleString()} sqft` : '';

  return `
New Rental Match!

A new listing matching your alert "${alert.name}" is available:

${listing.title}
${listing.address}
${listing.neighborhood}

${listing.bedrooms} Bedrooms • ${listing.bathrooms} Bathrooms${sqftText}
$${listing.price.toLocaleString()}/month • ${feeText}

View listing: ${listing.listingUrl}
  `.trim();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Maps Resend error codes to user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific Resend error codes
    const message = error.message.toLowerCase();

    if (message.includes('invalid_email')) {
      return 'Invalid email address';
    }
    if (message.includes('rate_limit')) {
      return 'Rate limit exceeded, please try again later';
    }
    if (message.includes('invalid_api_key')) {
      return 'Email service configuration error';
    }
    if (message.includes('missing_required_field')) {
      return 'Missing required email fields';
    }

    return error.message;
  }

  return 'Unknown error occurred';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Tests email configuration by sending a test email
 * Useful for debugging and setup verification
 */
export async function testEmailConfiguration(testEmail: string): Promise<EmailResult> {
  if (!validateEmailAddress(testEmail)) {
    return {
      success: false,
      error: 'Invalid test email address',
    };
  }

  return sendEmail({
    to: testEmail,
    subject: 'Test Email from Rent Notifications',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Email Configuration Test</h2>
        <p>This is a test email from your Rent Notifications system.</p>
        <p>If you're receiving this, your email integration is working correctly!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="color: #666; font-size: 14px;">
          This email was sent from your Rent Notifications application.
        </p>
      </div>
    `,
  });
}

/**
 * Gets email service health status
 */
export function getEmailServiceStatus(): {
  enabled: boolean;
  configured: boolean;
  apiKeyPresent: boolean;
} {
  const apiKeyPresent = !!process.env.RESEND_API_KEY;

  return {
    enabled: isEmailEnabled(),
    configured: apiKeyPresent,
    apiKeyPresent,
  };
}
