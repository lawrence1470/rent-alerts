/**
 * GET /api/alerts/[id]/runs
 * Returns run history for a specific alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getAlertRunHistory, getAlertRunTrend } from '@/lib/services/alert-statistics.service';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const trend = searchParams.get('trend') === 'true';
    const days = parseInt(searchParams.get('days') || '7');

    // Return trend data if requested
    if (trend) {
      const trendData = await getAlertRunTrend(id, days);
      return NextResponse.json({ trend: trendData });
    }

    // Return run history
    const runs = await getAlertRunHistory(id, limit);

    return NextResponse.json({ runs });

  } catch (error) {
    console.error('Error fetching alert runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert runs' },
      { status: 500 }
    );
  }
}
