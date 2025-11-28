/**
 * GET /api/alerts/[id]/stats
 * Returns statistics and analytics for a specific alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import {
  getAlertStats,
  getAlertRunComparison,
  getLatestAlertRun
} from '@/lib/services/alert-statistics.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify alert belongs to user
    const alert = await db.query.alerts.findFirst({
      where: eq(alerts.id, id),
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (alert.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeComparison = searchParams.get('comparison') === 'true';
    const includeLatest = searchParams.get('latest') === 'true';

    // Get basic statistics
    const stats = await getAlertStats(id);

    const response: {
      stats: typeof stats;
      comparison?: Awaited<ReturnType<typeof getAlertRunComparison>>;
      latestRun?: Awaited<ReturnType<typeof getLatestAlertRun>>;
    } = { stats };

    // Include comparison if requested
    if (includeComparison) {
      const comparison = await getAlertRunComparison(id);
      response.comparison = comparison;
    }

    // Include latest run if requested
    if (includeLatest) {
      const latestRun = await getLatestAlertRun(id);
      response.latestRun = latestRun;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert statistics' },
      { status: 500 }
    );
  }
}
