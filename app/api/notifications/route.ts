/**
 * Notifications API Route
 *
 * Handles user notification retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUnreadNotificationCount,
} from '@/lib/services/notification.service';
import { db } from '@/lib/db';
import { notifications, alerts, listings } from '@/lib/schema';
import { eq, and, desc, gt, gte, lt } from 'drizzle-orm';

// ============================================================================
// GET /api/notifications - Get user's notifications with filtering
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor'); // ISO date string for pagination
    const alertId = searchParams.get('alertId');
    const channel = searchParams.get('channel') as 'email' | 'sms' | 'in_app' | null;
    const days = searchParams.get('days'); // 7, 30, or null for all

    // Build conditions array
    const conditions = [eq(notifications.userId, userId)];

    // Filter by alert
    if (alertId) {
      conditions.push(eq(notifications.alertId, alertId));
    }

    // Filter by channel
    if (channel) {
      conditions.push(eq(notifications.channel, channel));
    }

    // Filter by date range
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      conditions.push(gte(notifications.createdAt, daysAgo));
    }

    // Cursor-based pagination
    if (cursor) {
      conditions.push(lt(notifications.createdAt, new Date(cursor)));
    }

    // Query with joins
    const userNotifications = await db
      .select({
        id: notifications.id,
        createdAt: notifications.createdAt,
        channel: notifications.channel,
        status: notifications.status,
        sentAt: notifications.sentAt,
        alert: {
          id: alerts.id,
          name: alerts.name,
        },
        listing: {
          id: listings.id,
          address: listings.address,
          price: listings.price,
          listingUrl: listings.listingUrl,
          bedrooms: listings.bedrooms,
          bathrooms: listings.bathrooms,
          neighborhood: listings.neighborhood,
        },
      })
      .from(notifications)
      .leftJoin(alerts, eq(notifications.alertId, alerts.id))
      .leftJoin(listings, eq(notifications.listingId, listings.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1); // Fetch one extra to check for next page

    // Check if there are more results
    const hasMore = userNotifications.length > limit;
    const results = hasMore ? userNotifications.slice(0, limit) : userNotifications;

    // Get next cursor from last item
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(userId);

    return NextResponse.json({
      notifications: results,
      nextCursor,
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/notifications - Mark notifications as read
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all user's notifications as sent
      await db.update(notifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.status, 'pending')
        ));

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notificationIds' },
        { status: 400 }
      );
    }

    // Mark specific notifications as sent
    for (const notificationId of notificationIds) {
      await db.update(notifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
