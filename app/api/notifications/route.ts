/**
 * Notifications API Route
 *
 * Handles user notification retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from '@/lib/services/notification.service';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// GET /api/notifications - Get user's notifications
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const userNotifications = await getUserNotifications(userId, limit);
    const unreadCount = await getUnreadNotificationCount(userId);

    // Filter for unread if requested
    const filteredNotifications = unreadOnly
      ? userNotifications.filter(n => n.status === 'pending')
      : userNotifications;

    return NextResponse.json({
      notifications: filteredNotifications,
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
