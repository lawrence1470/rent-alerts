/**
 * SMS Testing API Endpoint
 *
 * POST /api/notifications/test-sms
 * Allows authenticated users to test SMS notifications
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendSMS, isSMSEnabled, testTwilioConnection, formatToE164, isValidE164 } from '@/lib/services/sms.service';

// ============================================================================
// POST - Send Test SMS
// ============================================================================

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if SMS is enabled
    if (!isSMSEnabled()) {
      return NextResponse.json(
        {
          error: 'SMS notifications not configured',
          message: 'Twilio environment variables are not set. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { to, message } = body;

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Format and validate phone number
    const formattedPhone = formatToE164(to);
    if (!isValidE164(formattedPhone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format',
          message: 'Phone number must be in E.164 format (e.g., +15551234567)',
          providedNumber: to,
          formattedNumber: formattedPhone,
        },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendSMS({
      to: formattedPhone,
      body: message,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        messageSid: result.messageSid,
        status: result.status,
        phoneNumber: formattedPhone,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          phoneNumber: formattedPhone,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Test SMS error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: err.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Test Twilio Connection
// ============================================================================

export async function GET(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test Twilio connection
    const connectionTest = await testTwilioConnection();

    if (connectionTest.success) {
      return NextResponse.json({
        success: true,
        message: connectionTest.message,
        accountSid: connectionTest.accountSid,
        phoneNumber: connectionTest.phoneNumber,
        smsEnabled: isSMSEnabled(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: connectionTest.message,
          smsEnabled: isSMSEnabled(),
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Twilio connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Twilio connection',
        message: err.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
