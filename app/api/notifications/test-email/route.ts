/**
 * Test Email API Endpoint
 *
 * Sends a test email to verify Resend integration
 * POST /api/notifications/test-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { testEmailConfiguration, isEmailEnabled, validateEmailAddress, formatRentalNotificationEmail, sendEmail } from '@/lib/services/email.service';

// ============================================================================
// POST - Send Test Email
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if email service is enabled
    if (!isEmailEnabled()) {
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: 'RESEND_API_KEY environment variable is not set',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, testType = 'simple' } = body;

    // Validate email address
    if (!email || !validateEmailAddress(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Handle different test types
    if (testType === 'simple') {
      // Send simple configuration test email
      const result = await testEmailConfiguration(email);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to send test email',
          },
          { status: 500 }
        );
      }
    } else if (testType === 'rental') {
      // Send a realistic rental notification email
      // Create sample data
      const sampleListing = {
        id: 'test-listing-id',
        streetEasyId: 'test-123',
        title: 'Beautiful 2BR Apartment in East Village',
        address: '123 E 10th Street, Apt 4B',
        neighborhood: 'East Village',
        price: 3500,
        bedrooms: 2,
        bathrooms: 1.5,
        sqft: 900,
        noFee: true,
        listingUrl: 'https://streeteasy.com/sample-listing',
        imageUrl: 'https://via.placeholder.com/600x400/4a5568/ffffff?text=Sample+Rental+Listing',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        isActive: true,
        latitude: null,
        longitude: null,
        rawData: null,
        rentStabilizedStatus: 'unknown',
        rentStabilizedProbability: null,
        rentStabilizedSource: null,
        rentStabilizedCheckedAt: null,
        buildingDhcrId: null,
      };

      const sampleAlert = {
        id: 'test-alert-id',
        userId,
        name: 'East Village 2BR under $4,000',
        areas: 'east-village',
        minPrice: null,
        maxPrice: 4000,
        minBeds: 2,
        maxBeds: null,
        minBaths: null,
        noFee: false,
        filterRentStabilized: false,
        enablePhoneNotifications: true,
        enableEmailNotifications: true,
        preferredFrequency: '1hour' as const,
        notifyOnlyNewApartments: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: null,
      };

      // Format and send rental notification email
      const { subject, html } = formatRentalNotificationEmail(
        sampleListing,
        sampleAlert
      );

      const result = await sendEmail({
        to: email,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Test rental notification email sent successfully',
          messageId: result.messageId,
          preview: {
            subject,
            listing: {
              address: sampleListing.address,
              price: sampleListing.price,
              bedrooms: sampleListing.bedrooms,
            },
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to send test rental email',
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid test type. Use "simple" or "rental"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Check Email Service Status
// ============================================================================

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enabled = isEmailEnabled();

    return NextResponse.json({
      emailServiceEnabled: enabled,
      resendConfigured: !!process.env.RESEND_API_KEY,
      status: enabled ? 'operational' : 'not_configured',
    });
  } catch (error) {
    console.error('Email status check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
