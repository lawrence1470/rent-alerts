/**
 * Audit Logs Cleanup Cron Job
 *
 * Runs daily to delete expired audit logs based on retention policy
 *
 * Vercel cron configuration (add to vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/cleanup-audit-logs",
 *       "schedule": "0 2 * * *"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredLogs } from '@/lib/services/audit-logger.service';
import { logInfo, logError } from '@/lib/services/audit-logger.service';

// ============================================================================
// SECURITY
// ============================================================================

function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    console.error('Missing authorization header');
    return false;
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  if (authHeader !== expectedAuth) {
    console.error('Invalid authorization token');
    return false;
  }

  return true;
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify request is authorized
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting audit logs cleanup...');

    // Run cleanup
    const deletedCount = await cleanupExpiredLogs();

    const duration = Date.now() - startTime;

    // Log cleanup success
    await logInfo(
      'system',
      'cleanup-audit-logs',
      `Audit logs cleanup completed: ${deletedCount} logs deleted`,
      {
        duration,
        metadata: {
          deletedCount,
        },
      }
    );

    console.log(`Audit logs cleanup completed: ${deletedCount} logs deleted in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Audit logs cleanup completed',
      deletedCount,
      duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log cleanup failure
    await logError(
      'system',
      'cleanup-audit-logs',
      'Audit logs cleanup failed',
      {
        error,
        duration,
      }
    );

    console.error('Audit logs cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max execution time
