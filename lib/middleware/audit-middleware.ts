/**
 * Audit Middleware
 *
 * Automatic error logging middleware for Next.js API routes
 *
 * Usage:
 * import { withAudit } from '@/lib/middleware/audit-middleware';
 *
 * export const GET = withAudit(async (request) => {
 *   // Your route logic
 * }, { source: 'GET /api/alerts' });
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logAPIError, logInfo } from '../services/audit-logger.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

export interface AuditMiddlewareOptions {
  source: string; // e.g., "GET /api/alerts", "POST /api/webhooks/clerk"
  logSuccess?: boolean; // Log successful requests (default: false)
  captureRequestBody?: boolean; // Capture request body in metadata (default: false, privacy risk)
  captureResponseBody?: boolean; // Capture response body in metadata (default: false)
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wraps an API route handler with automatic audit logging
 *
 * Features:
 * - Automatic error logging with full context
 * - Performance tracking (response time)
 * - User context extraction from Clerk
 * - Optional success logging
 * - Request/response capture for debugging
 */
export function withAudit(
  handler: RouteHandler,
  options: AuditMiddlewareOptions
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();
    let userId: string | null = null;

    try {
      // Extract user ID from Clerk auth (if available)
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch {
        // Auth may not be available for some routes (e.g., webhooks)
      }

      // Execute the actual route handler
      const response = await handler(request, context);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log successful requests if configured
      if (options.logSuccess && response.ok) {
        const metadata: Record<string, any> = {
          statusCode: response.status,
        };

        // Capture response body if configured (privacy risk!)
        if (options.captureResponseBody) {
          try {
            const clonedResponse = response.clone();
            const body = await clonedResponse.json();
            metadata.responseBody = body;
          } catch {
            // Body not JSON or already consumed
          }
        }

        await logInfo(
          'api_route',
          options.source,
          `Request completed successfully (${response.status})`,
          {
            userId: userId || undefined,
            request,
            duration,
            metadata,
          }
        );
      }

      return response;

    } catch (error) {
      // Calculate duration even for errors
      const duration = Date.now() - startTime;

      // Build metadata
      const metadata: Record<string, any> = {
        errorOccurredAt: new Date().toISOString(),
      };

      // Capture request body if configured (privacy risk!)
      if (options.captureRequestBody) {
        try {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          metadata.requestBody = body;
        } catch {
          // Body not JSON or already consumed
        }
      }

      // Log the error
      await logAPIError(
        options.source,
        `Unhandled error in ${options.source}`,
        error,
        request,
        {
          userId: userId || undefined,
          duration,
          metadata,
        }
      );

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  };
}

// ============================================================================
// SPECIALIZED MIDDLEWARE VARIANTS
// ============================================================================

/**
 * Middleware for authenticated routes
 * Automatically logs auth failures
 */
export function withAuthAudit(
  handler: RouteHandler,
  options: Omit<AuditMiddlewareOptions, 'source'> & { source: string }
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const { userId } = await auth();

      if (!userId) {
        // Log authentication failure
        await logAPIError(
          options.source,
          'Unauthorized request',
          new Error('User not authenticated'),
          request
        );

        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Continue with original handler
      return withAudit(handler, options)(request, context);

    } catch (error) {
      // Log auth error
      await logAPIError(
        options.source,
        'Authentication check failed',
        error,
        request
      );

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for webhook routes
 * Special handling for webhook authentication and logging
 */
export function withWebhookAudit(
  handler: RouteHandler,
  options: Omit<AuditMiddlewareOptions, 'source'> & {
    source: string;
    webhookType: 'clerk' | 'stripe';
  }
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();

    try {
      // Execute webhook handler
      const response = await handler(request, context);

      // Log successful webhook processing
      await logInfo(
        'webhook',
        options.source,
        `${options.webhookType} webhook processed successfully`,
        {
          request,
          duration: Date.now() - startTime,
          metadata: {
            webhookType: options.webhookType,
          },
        }
      );

      return response;

    } catch (error) {
      // Log webhook processing error
      await logAPIError(
        options.source,
        `${options.webhookType} webhook processing failed`,
        error,
        request,
        {
          duration: Date.now() - startTime,
          metadata: {
            webhookType: options.webhookType,
          },
        }
      );

      throw error;
    }
  };
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Create standardized error response with automatic logging
 */
export async function createErrorResponse(
  source: string,
  message: string,
  error: unknown,
  request: NextRequest,
  statusCode: number = 500,
  options?: {
    userId?: string;
    metadata?: Record<string, any>;
  }
): Promise<NextResponse> {
  // Log the error
  await logAPIError(source, message, error, request, {
    userId: options?.userId,
    metadata: options?.metadata,
  });

  // Return standardized error response
  return NextResponse.json(
    {
      error: statusCode === 500
        ? 'Internal server error'
        : message,
    },
    { status: statusCode }
  );
}

/**
 * Create validation error response with automatic logging
 */
export async function createValidationErrorResponse(
  source: string,
  validationErrors: Record<string, any>,
  request: NextRequest,
  options?: {
    userId?: string;
  }
): Promise<NextResponse> {
  const { logValidationError } = await import('../services/audit-logger.service');

  // Log validation error
  await logValidationError(
    source,
    'Request validation failed',
    validationErrors,
    {
      userId: options?.userId,
      request,
    }
  );

  // Return validation error response
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: validationErrors,
    },
    { status: 400 }
  );
}
