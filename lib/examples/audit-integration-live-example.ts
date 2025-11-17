/**
 * Live Integration Example - Before & After
 *
 * Shows how to migrate an existing API route to use audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { rebuildAllBatches } from '@/lib/services/alert-batching.service';

// ============================================================================
// BEFORE: Original Implementation (from app/api/alerts/route.ts)
// ============================================================================

export async function POST_Original(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.areas) {
      return NextResponse.json(
        { error: 'Missing required fields: name, areas' },
        { status: 400 }
      );
    }

    // Validate price range logic
    if (body.minPrice != null && body.maxPrice != null && body.minPrice > body.maxPrice) {
      return NextResponse.json(
        { error: 'Invalid price range: minimum price cannot exceed maximum price' },
        { status: 400 }
      );
    }

    // Create alert
    const [newAlert] = await db.insert(alerts).values({
      userId,
      name: body.name,
      areas: body.areas,
      minPrice: body.minPrice ?? null,
      maxPrice: body.maxPrice ?? null,
      minBeds: body.minBeds ?? null,
      maxBeds: body.maxBeds ?? null,
      minBaths: body.minBaths ?? null,
      noFee: body.noFee ?? false,
      isActive: true,
    }).returning();

    // Rebuild batches to include the new alert
    await rebuildAllBatches();

    return NextResponse.json({
      success: true,
      alert: newAlert,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating alert:', error); // ❌ Only console logging
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// ============================================================================
// AFTER: With Audit Logging Middleware (Recommended)
// ============================================================================

import { withAuthAudit } from '@/lib/middleware/audit-middleware';

export const POST_WithMiddleware = withAuthAudit(
  async (request: NextRequest) => {
    const { userId } = await auth();

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.areas) {
      return NextResponse.json(
        { error: 'Missing required fields: name, areas' },
        { status: 400 }
      );
    }

    // Validate price range logic
    if (body.minPrice != null && body.maxPrice != null && body.minPrice > body.maxPrice) {
      return NextResponse.json(
        { error: 'Invalid price range: minimum price cannot exceed maximum price' },
        { status: 400 }
      );
    }

    // Create alert
    const [newAlert] = await db.insert(alerts).values({
      userId,
      name: body.name,
      areas: body.areas,
      minPrice: body.minPrice ?? null,
      maxPrice: body.maxPrice ?? null,
      minBeds: body.minBeds ?? null,
      maxBeds: body.maxBeds ?? null,
      minBaths: body.minBaths ?? null,
      noFee: body.noFee ?? false,
      isActive: true,
    }).returning();

    // Rebuild batches to include the new alert
    await rebuildAllBatches();

    return NextResponse.json({
      success: true,
      alert: newAlert,
    }, { status: 201 });
  },
  {
    source: 'POST /api/alerts',
    // ✅ Automatic error logging with full context
    // ✅ Automatic auth failure logging
    // ✅ Performance tracking
  }
);

// ============================================================================
// AFTER: With Manual Audit Logging (Alternative)
// ============================================================================

import {
  logValidationError,
  logDatabaseError,
  logAPIError,
} from '@/lib/services/audit-logger.service';

export async function POST_WithManualLogging(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { userId } = await auth();

    if (!userId) {
      // ✅ Log authentication failure
      await logAPIError(
        'POST /api/alerts',
        'Unauthorized request - no user ID',
        new Error('User not authenticated'),
        request
      );

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const validationErrors: Record<string, string> = {};

    if (!body.name) {
      validationErrors.name = 'Name is required';
    }
    if (!body.areas) {
      validationErrors.areas = 'Areas are required';
    }
    if (body.minPrice != null && body.maxPrice != null && body.minPrice > body.maxPrice) {
      validationErrors.priceRange = 'Minimum price cannot exceed maximum price';
    }

    if (Object.keys(validationErrors).length > 0) {
      // ✅ Log validation errors with details
      await logValidationError(
        'POST /api/alerts',
        'Alert creation validation failed',
        validationErrors,
        {
          userId,
          request,
          metadata: {
            submittedData: {
              name: body.name,
              areas: body.areas,
              minPrice: body.minPrice,
              maxPrice: body.maxPrice,
            },
          },
        }
      );

      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Create alert
    let newAlert;
    try {
      [newAlert] = await db.insert(alerts).values({
        userId,
        name: body.name,
        areas: body.areas,
        minPrice: body.minPrice ?? null,
        maxPrice: body.maxPrice ?? null,
        minBeds: body.minBeds ?? null,
        maxBeds: body.maxBeds ?? null,
        minBaths: body.minBaths ?? null,
        noFee: body.noFee ?? false,
        isActive: true,
      }).returning();
    } catch (error) {
      // ✅ Log database errors specifically
      await logDatabaseError(
        'insertAlert',
        error,
        {
          userId,
          metadata: {
            table: 'alerts',
            operation: 'INSERT',
            data: {
              name: body.name,
              areas: body.areas,
            },
          },
        }
      );
      throw error;
    }

    // Rebuild batches to include the new alert
    try {
      await rebuildAllBatches();
    } catch (error) {
      // ✅ Log batch rebuild errors (but don't fail the request)
      await logAPIError(
        'POST /api/alerts',
        'Alert created but batch rebuild failed',
        error,
        request,
        {
          userId,
          alertId: newAlert.id,
          metadata: {
            phase: 'batch_rebuild',
          },
        }
      );
      // Continue - alert was created successfully
    }

    return NextResponse.json({
      success: true,
      alert: newAlert,
    }, { status: 201 });

  } catch (error) {
    // ✅ Log general API errors with full context
    await logAPIError(
      'POST /api/alerts',
      'Failed to create alert',
      error,
      request,
      {
        duration: Date.now() - startTime,
        metadata: {
          phase: 'general_error',
        },
      }
    );

    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// ============================================================================
// COMPARISON SUMMARY
// ============================================================================

/**
 * BEFORE (Original):
 * - ❌ Only console.error for errors
 * - ❌ No context about what went wrong
 * - ❌ No user tracking
 * - ❌ No performance metrics
 * - ❌ No correlation to related entities
 * - ❌ Hard to debug production issues
 *
 * AFTER (With Middleware):
 * - ✅ Automatic error logging with full context
 * - ✅ Automatic auth failure tracking
 * - ✅ Performance timing
 * - ✅ User ID tracking
 * - ✅ Request metadata
 * - ✅ Stack traces
 * - ✅ Minimal code changes
 * - ✅ Non-blocking (never breaks primary flow)
 *
 * AFTER (With Manual Logging):
 * - ✅ Granular error tracking
 * - ✅ Specific error categorization
 * - ✅ Validation error details
 * - ✅ Database error isolation
 * - ✅ Phase-specific tracking
 * - ⚠️ More verbose code
 * - ⚠️ More maintenance
 *
 * RECOMMENDATION:
 * - Use middleware for most routes (simple, automatic)
 * - Use manual logging for critical routes needing granular tracking
 */

// ============================================================================
// MIGRATION STEPS
// ============================================================================

/**
 * Step 1: Import middleware
 * ```typescript
 * import { withAuthAudit } from '@/lib/middleware/audit-middleware';
 * ```
 *
 * Step 2: Wrap handler
 * ```typescript
 * export const POST = withAuthAudit(
 *   async (request) => {
 *     // Your existing logic (no changes needed!)
 *   },
 *   { source: 'POST /api/route' }
 * );
 * ```
 *
 * Step 3: Remove try-catch if using middleware
 * The middleware handles all errors automatically
 *
 * Step 4: Test
 * - Trigger an error
 * - Check audit_logs table
 * - Verify error was logged with context
 *
 * Step 5: Monitor
 * - Use /api/admin/audit-logs?mode=health
 * - Check for spikes in errors
 * - Review error patterns
 */
