/**
 * Test Notifications Endpoint
 *
 * Diagnostic endpoint to test email/SMS configuration and verify notification system
 *
 * Usage:
 * GET /api/test-notifications - Check configuration status
 * POST /api/test-notifications - Send test email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getEmailServiceStatus, testEmailConfiguration } from '@/lib/services/email.service';
import { isSMSEnabled } from '@/lib/services/sms.service';
import { db } from '@/lib/db';

/**
 * GET - Check notification service status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check email configuration
    const emailStatus = getEmailServiceStatus();

    // Check SMS configuration
    const smsEnabled = isSMSEnabled();

    // Check user's email in database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    // Check active alerts
    const alerts = await db.query.alerts.findMany({
      where: (alerts, { eq }) => eq(alerts.userId, userId),
    });

    const activeAlerts = alerts.filter(a => a.isActive);

    return NextResponse.json({
      status: 'ok',
      configuration: {
        email: {
          enabled: emailStatus.enabled,
          configured: emailStatus.configured,
          apiKeyPresent: emailStatus.apiKeyPresent,
          resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        },
        sms: {
          enabled: smsEnabled,
          twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
        },
        cron: {
          cronSecretConfigured: !!process.env.CRON_SECRET,
        },
      },
      user: {
        id: userId,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        emailInDatabase: !!user?.email,
        phoneInDatabase: !!user?.phoneNumber,
      },
      alerts: {
        total: alerts.length,
        active: activeAlerts.length,
        withEmail: activeAlerts.filter(a => a.enableEmailNotifications).length,
        withSMS: activeAlerts.filter(a => a.enablePhoneNotifications).length,
      },
      recommendations: getRecommendations(emailStatus, smsEnabled, user, activeAlerts),
    });

  } catch (error) {
    console.error('Error checking notification status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check notification status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Send test email
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's email
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'No email address found for user' },
        { status: 400 }
      );
    }

    // Send test email
    const result = await testEmailConfiguration(user.email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${user.email}`,
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

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate recommendations
function getRecommendations(
  emailStatus: any,
  smsEnabled: boolean,
  user: any,
  activeAlerts: any[]
): string[] {
  const recommendations: string[] = [];

  if (!emailStatus.configured) {
    recommendations.push('⚠️ Add RESEND_API_KEY environment variable to enable email notifications');
  }

  if (!smsEnabled) {
    recommendations.push('ℹ️ Add TWILIO credentials to enable SMS notifications (optional)');
  }

  if (!user?.email) {
    recommendations.push('⚠️ User email not found in database - check Clerk webhook sync');
  }

  if (activeAlerts.length === 0) {
    recommendations.push('ℹ️ No active alerts found - create an alert to start receiving notifications');
  }

  const emailAlerts = activeAlerts.filter(a => a.enableEmailNotifications);
  if (emailAlerts.length === 0 && activeAlerts.length > 0) {
    recommendations.push('ℹ️ No alerts have email notifications enabled - update alert settings');
  }

  if (!process.env.CRON_SECRET) {
    recommendations.push('⚠️ CRON_SECRET not configured - cron endpoint will reject requests');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems configured correctly!');
  }

  return recommendations;
}

export const dynamic = 'force-dynamic';
