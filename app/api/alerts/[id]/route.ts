/**
 * Individual Alert API Route
 *
 * Handles operations on specific alerts (GET, PATCH, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { rebuildAllBatches } from '@/lib/services/alert-batching.service';

// ============================================================================
// GET /api/alerts/[id] - Get specific alert
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const alert = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.id, id),
        eq(alerts.userId, userId)
      ),
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });

  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/alerts/[id] - Update alert
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingAlert = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.id, id),
        eq(alerts.userId, userId)
      ),
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update alert
    const [updatedAlert] = await db.update(alerts)
      .set({
        name: body.name ?? existingAlert.name,
        areas: body.areas ?? existingAlert.areas,
        minPrice: body.minPrice !== undefined ? body.minPrice : existingAlert.minPrice,
        maxPrice: body.maxPrice !== undefined ? body.maxPrice : existingAlert.maxPrice,
        minBeds: body.minBeds !== undefined ? body.minBeds : existingAlert.minBeds,
        maxBeds: body.maxBeds !== undefined ? body.maxBeds : existingAlert.maxBeds,
        minBaths: body.minBaths !== undefined ? body.minBaths : existingAlert.minBaths,
        noFee: body.noFee !== undefined ? body.noFee : existingAlert.noFee,
        isActive: body.isActive !== undefined ? body.isActive : existingAlert.isActive,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();

    // Rebuild batches to reflect changes
    await rebuildAllBatches();

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/alerts/[id] - Delete alert
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingAlert = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.id, id),
        eq(alerts.userId, userId)
      ),
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Delete alert (cascade will handle related records)
    await db.delete(alerts).where(eq(alerts.id, id));

    // Rebuild batches
    await rebuildAllBatches();

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
