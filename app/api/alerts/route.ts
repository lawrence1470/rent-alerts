/**
 * Alerts API Route
 *
 * Handles CRUD operations for rental alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { rebuildAllBatches } from '@/lib/services/alert-batching.service';

// ============================================================================
// GET /api/alerts - List user's alerts
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

    const userAlerts = await db.query.alerts.findMany({
      where: eq(alerts.userId, userId),
      orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
    });

    return NextResponse.json({ alerts: userAlerts });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/alerts - Create new alert
// ============================================================================

export async function POST(request: NextRequest) {
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
      isActive: body.isActive ?? true,
    }).returning();

    // Rebuild batches to include the new alert
    await rebuildAllBatches();

    return NextResponse.json({
      success: true,
      alert: newAlert,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
