/**
 * Cron Job Endpoint
 *
 * Called by GitHub Actions every 15 minutes to check for new rental listings
 *
 * IMPORTANT: Automatic triggers are ONLY allowed in production.
 * Preview and localhost require manual=true query parameter.
 *
 * Usage:
 * - Production (automatic): GET /api/cron/check-alerts (with auth header)
 * - Preview/Localhost (manual): GET /api/cron/check-alerts?manual=true (with auth header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAllAlerts } from '@/lib/services/cron-job.service';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Checks if running in production environment
 * Returns true only for the main production domain
 */
function isProductionEnvironment(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'

  // Check Vercel environment variable first (most reliable)
  if (vercelEnv === 'production') {
    return true;
  }

  // Fallback: Check host for known production domains
  const productionDomains = [
    'rentnotify.com',
    'www.rentnotify.com',
    'rentnotify.vercel.app', // Your main Vercel production URL
  ];

  return productionDomains.some(domain => host.includes(domain));
}

/**
 * Checks if this is a preview deployment
 */
function isPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

/**
 * Checks if this is localhost/development
 */
function isLocalEnvironment(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.includes('localhost') || host.includes('127.0.0.1') || process.env.NODE_ENV === 'development';
}

// ============================================================================
// SECURITY
// ============================================================================

/**
 * Verifies the request is from authorized source
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

    // Check for manual trigger parameter
    const { searchParams } = new URL(request.url);
    const isManualTrigger = searchParams.get('manual') === 'true';
    const isProduction = isProductionEnvironment(request);
    const isPreview = isPreviewEnvironment();
    const isLocal = isLocalEnvironment(request);

    // Log environment info
    console.log('Cron request environment:', {
      isProduction,
      isPreview,
      isLocal,
      isManualTrigger,
      vercelEnv: process.env.VERCEL_ENV,
      host: request.headers.get('host'),
    });

    // Block automatic triggers on non-production environments
    if (!isProduction && !isManualTrigger) {
      console.log('Blocking automatic cron trigger on non-production environment');
      return NextResponse.json(
        {
          error: 'Automatic cron triggers are disabled on preview/localhost',
          message: 'Use ?manual=true to manually trigger alerts for testing',
          environment: {
            isProduction,
            isPreview,
            isLocal,
            vercelEnv: process.env.VERCEL_ENV,
          }
        },
        { status: 403 }
      );
    }

    console.log(`Starting cron job: check-alerts (${isManualTrigger ? 'manual' : 'automatic'} trigger)`);

    // Run the main cron job
    // Pass force=true for manual triggers to bypass timing checks
    const result = await checkAllAlerts(isManualTrigger);

    console.log('Cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Alert check completed successfully',
      trigger: isManualTrigger ? 'manual' : 'automatic',
      environment: isProduction ? 'production' : (isPreview ? 'preview' : 'local'),
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
