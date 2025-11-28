/**
 * Audit Logging Integration Examples
 *
 * Demonstrates how to integrate audit logging throughout the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  logAPIError,
  logExternalAPIError,
  logDatabaseError,
  logWebhookError,
  logCronJobError,
  logNotificationError,
  logValidationError,
} from '../services/audit-logger.service';
import {
  withAudit,
  withAuthAudit,
  withWebhookAudit,
  createErrorResponse,
  createValidationErrorResponse,
} from '../middleware/audit-middleware';

// ============================================================================
// EXAMPLE 1: API Route with Middleware
// ============================================================================

/**
 * Automatic error logging with middleware wrapper
 * File: app/api/alerts/route.ts
 */
export const GET_AlertsWithMiddleware = withAuthAudit(
  async (request: NextRequest) => {
    const { userId } = await auth();

    // Your business logic here
    const alerts: any[] = []; // fetch alerts from DB

    return NextResponse.json({ alerts });
  },
  {
    source: 'GET /api/alerts',
    logSuccess: false, // Don't log every successful request
  }
);

// ============================================================================
// EXAMPLE 2: Manual Error Logging in API Route
// ============================================================================

/**
 * Manual error logging with try-catch
 * File: app/api/alerts/[id]/route.ts
 */
export async function PATCH_AlertManual(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (body.minPrice > body.maxPrice) {
      return createValidationErrorResponse(
        'PATCH /api/alerts/[id]',
        { priceRange: 'Min price cannot exceed max price' },
        request,
        { userId }
      );
    }

    // Update alert in database
    // ... database operation

    return NextResponse.json({ success: true });

  } catch (error) {
    return createErrorResponse(
      'PATCH /api/alerts/[id]',
      'Failed to update alert',
      error,
      request,
      500
    );
  }
}

// ============================================================================
// EXAMPLE 3: External API Error Logging
// ============================================================================

/**
 * Logging StreetEasy API failures
 * File: lib/services/streeteasy-api.service.ts
 */
export async function fetchStreetEasyListings(criteria: any) {
  try {
    const response = await fetch('https://api.streeteasy.com/...', {
      headers: {
        'X-RapidAPI-Key': process.env.STREETEASY_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`StreetEasy API error: ${response.status}`);
    }

    return response.json();

  } catch (error) {
    // Log external API failure
    await logExternalAPIError(
      'StreetEasy',
      'fetchListings',
      error,
      {
        metadata: {
          criteria,
          apiEndpoint: 'https://api.streeteasy.com/...',
        },
      }
    );

    throw error; // Re-throw to handle at higher level
  }
}

/**
 * Logging Twilio SMS failures
 * File: lib/services/notification.service.ts
 */
export async function sendSMS(to: string, message: string, notificationId: string) {
  try {
    const response = await fetch('https://api.twilio.com/...', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${process.env.TWILIO_AUTH}` },
      body: JSON.stringify({ to, body: message }),
    });

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.status}`);
    }

    return response.json();

  } catch (error) {
    // Log notification failure
    await logNotificationError(
      'sms',
      error,
      notificationId,
      {
        metadata: {
          to: to.replace(/\d{4}$/, 'XXXX'), // Anonymize phone number
          messageLength: message.length,
        },
      }
    );

    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Database Error Logging
// ============================================================================

/**
 * Logging database operation failures
 * File: lib/services/alert-batching.service.ts
 */
export async function createAlertBatch(criteria: any) {
  try {
    const batch = await db.insert(alertBatches).values(criteria).returning();
    return batch[0];

  } catch (error) {
    // Log database error
    await logDatabaseError(
      'createAlertBatch',
      error,
      {
        metadata: {
          operation: 'INSERT',
          table: 'alert_batches',
          criteria,
        },
      }
    );

    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Webhook Error Logging
// ============================================================================

/**
 * Clerk webhook with error logging
 * File: app/api/webhooks/clerk/route.ts
 */
export const POST_ClerkWebhook = withWebhookAudit(
  async (request: NextRequest) => {
    const evt = await verifyClerkWebhook(request);

    // Process webhook event
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      // ... other events
    }

    return NextResponse.json({ success: true });
  },
  {
    source: 'POST /api/webhooks/clerk',
    webhookType: 'clerk',
  }
);

// Or with manual error handling:
export async function POST_ClerkWebhookManual(request: NextRequest) {
  try {
    const evt = await verifyClerkWebhook(request);

    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      default:
        throw new Error(`Unhandled event type: ${evt.type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    await logWebhookError(
      'clerk',
      'user.created',
      error,
      request,
      {
        metadata: {
          // Add any relevant webhook data (sanitized)
        },
      }
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 6: Cron Job Error Logging
// ============================================================================

/**
 * Enhanced cron job with detailed error logging
 * File: lib/services/cron-job.service.ts
 */
export async function checkAllAlertsWithLogging() {
  const startTime = Date.now();
  const cronJobLog = await createCronJobLog('check-alerts', 'started');

  try {
    // Your existing cron logic
    const result = await processAlerts();

    // Complete cron job log
    await completeCronJobLog(cronJobLog.id, 'completed', {
      duration: Date.now() - startTime,
      alertsProcessed: result.alertsProcessed,
    });

    return result;

  } catch (error) {
    // Log detailed cron error
    await logCronJobError(
      'check-alerts',
      error,
      cronJobLog.id,
      {
        duration: Date.now() - startTime,
        metadata: {
          phase: 'alert_processing',
          // Add any relevant context
        },
      }
    );

    // Complete cron job log with failure
    await completeCronJobLog(cronJobLog.id, 'failed', {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Individual alert processing with error tracking
 */
async function processAlert(alert: any, cronJobLogId: string) {
  try {
    // Process alert logic
    const listings = await fetchListings(alert);
    return listings;

  } catch (error) {
    // Log alert-specific error
    await logCronJobError(
      'processAlert',
      error,
      cronJobLogId,
      {
        alertId: alert.id,
        metadata: {
          alertName: alert.name,
          criteria: alert.criteria,
        },
      }
    );

    // Continue with other alerts even if this one fails
    return [];
  }
}

// ============================================================================
// EXAMPLE 7: Validation Error Logging
// ============================================================================

/**
 * Input validation with detailed error logging
 * File: app/api/alerts/route.ts
 */
export async function POST_AlertWithValidation(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const errors: Record<string, string> = {};

    if (!body.name) {
      errors.name = 'Name is required';
    }
    if (!body.areas) {
      errors.areas = 'Areas are required';
    }
    if (body.minPrice && body.maxPrice && body.minPrice > body.maxPrice) {
      errors.priceRange = 'Min price cannot exceed max price';
    }

    if (Object.keys(errors).length > 0) {
      // Log validation errors
      await logValidationError(
        'POST /api/alerts',
        'Alert creation validation failed',
        errors,
        {
          userId,
          request,
          metadata: {
            submittedData: {
              ...body,
              // Don't log sensitive data if any
            },
          },
        }
      );

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await createAlert(body, userId);

    return NextResponse.json({ success: true, alert }, { status: 201 });

  } catch (error) {
    return createErrorResponse(
      'POST /api/alerts',
      'Failed to create alert',
      error,
      request,
      500
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS (STUBS FOR EXAMPLE)
// ============================================================================

// These are just stubs for the examples above
async function verifyClerkWebhook(request: NextRequest) {
  return { type: 'user.created', data: {} };
}

async function handleUserCreated(data: any) {
  // Implementation
}

async function processAlerts() {
  return { alertsProcessed: 0 };
}

async function fetchListings(alert: any) {
  return [];
}

async function createAlert(data: any, userId: string) {
  return { id: '123', ...data };
}

async function createCronJobLog(name: string, status: string) {
  return { id: '123' };
}

async function completeCronJobLog(id: string, status: string, data: any) {
  // Implementation
}

// Mock DB import
const db = {
  insert: (table: any) => ({
    values: (data: any) => ({
      returning: async () => [data],
    }),
  }),
};

const alertBatches = {};
