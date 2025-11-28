/**
 * Admin Audit Logs API
 *
 * Query and analyze audit logs for system monitoring and debugging
 * Requires admin authentication (you should add admin check in production)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  queryAuditLogs,
  getRecentErrors,
  getCriticalErrors,
  getUserErrors,
  getSystemHealthMetrics,
  getPerformanceMetrics,
  searchAuditLogs,
  exportAuditLogsCSV,
} from '@/lib/services/audit-query.service';

// ============================================================================
// GET /api/admin/audit-logs - Query audit logs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check in production
    // const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    // if (!user?.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const mode = searchParams.get('mode') || 'query';
    const level = searchParams.get('level') as any;
    const category = searchParams.get('category') as any;
    const source = searchParams.get('source') || undefined;
    const targetUserId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined;
    const searchTerm = searchParams.get('search');
    const exportFormat = searchParams.get('export');

    // Handle different query modes
    switch (mode) {
      case 'health':
        const health = await getSystemHealthMetrics();
        return NextResponse.json(health);

      case 'performance':
        const hours = searchParams.get('hours')
          ? parseInt(searchParams.get('hours')!)
          : 24;
        const perf = await getPerformanceMetrics(hours);
        return NextResponse.json(perf);

      case 'recent-errors':
        const recentLimit = limit || 50;
        const recentErrors = await getRecentErrors(recentLimit);
        return NextResponse.json({ logs: recentErrors });

      case 'critical':
        const critical = await getCriticalErrors();
        return NextResponse.json({ logs: critical });

      case 'user-errors':
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'userId parameter required for user-errors mode' },
            { status: 400 }
          );
        }
        const userHours = searchParams.get('hours')
          ? parseInt(searchParams.get('hours')!)
          : 24;
        const userErrors = await getUserErrors(targetUserId, userHours);
        return NextResponse.json({ logs: userErrors });

      case 'search':
        if (!searchTerm) {
          return NextResponse.json(
            { error: 'search parameter required for search mode' },
            { status: 400 }
          );
        }
        const searchResults = await searchAuditLogs(searchTerm, {
          level,
          category,
          startDate,
          endDate,
          limit,
        });
        return NextResponse.json({ logs: searchResults });

      case 'export':
        const csv = await exportAuditLogsCSV({
          level,
          category,
          source,
          userId: targetUserId,
          startDate,
          endDate,
        });

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
          },
        });

      case 'query':
      default:
        const logs = await queryAuditLogs({
          level,
          category,
          source,
          userId: targetUserId,
          startDate,
          endDate,
          limit,
        });
        return NextResponse.json({ logs });
    }

  } catch (error) {
    console.error('Error querying audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to query audit logs' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
