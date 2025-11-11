/**
 * Cron Job Endpoint
 *
 * Called by Vercel Cron every 15 minutes to check for new rental listings
 *
 * Vercel cron configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-alerts",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAllAlerts } from '@/lib/services/cron-job.service';

// ============================================================================
// SECURITY
// ============================================================================

/**
 * Verifies the request is from Vercel Cron
 * Uses Authorization header with secret token
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Check for Vercel Cron secret
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

  // Vercel Cron sends: Bearer <secret>
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
  try {
    // Verify request is authorized
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting cron job: check-alerts');

    // Run the main cron job
    const result = await checkAllAlerts();

    console.log('Cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Alert check completed successfully',
      stats: result,
    });

  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time
