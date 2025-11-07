/**
 * Notification Service
 *
 * Handles creating and sending notifications to users
 */

import { db } from '../db';
import { notifications, type Alert, type Listing, type Notification } from '../schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================
export type NotificationChannel = 'email' | 'in_app' | 'push';

export interface NotificationData {
  userId: string;
  alertId: string;
  listingId: string;
  channel: NotificationChannel;
  subject?: string;
  body?: string;
}

// ============================================================================
// NOTIFICATION CREATION
// ============================================================================

/**
 * Creates a notification record in the database
 */
export async function createNotification(data: NotificationData): Promise<Notification> {
  const [notification] = await db.insert(notifications).values({
    userId: data.userId,
    alertId: data.alertId,
    listingId: data.listingId,
    channel: data.channel,
    subject: data.subject,
    body: data.body,
    status: 'pending',
  }).returning();

  return notification;
}

/**
 * Creates multiple notifications in a batch
 */
export async function createBulkNotifications(notificationsData: NotificationData[]): Promise<Notification[]> {
  if (notificationsData.length === 0) return [];

  const created = await db.insert(notifications).values(notificationsData).returning();
  return created;
}

/**
 * Generates notifications for new listings matching an alert
 */
export async function generateNotificationsForAlert(
  alert: Alert,
  newListings: Listing[],
  channel: NotificationChannel = 'in_app'
): Promise<Notification[]> {
  if (newListings.length === 0) return [];

  const notificationsData: NotificationData[] = newListings.map(listing => ({
    userId: alert.userId,
    alertId: alert.id,
    listingId: listing.id,
    channel,
    subject: generateNotificationSubject(alert, listing),
    body: generateNotificationBody(alert, listing),
  }));

  return createBulkNotifications(notificationsData);
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

/**
 * Marks a notification as sent
 */
export async function markNotificationSent(notificationId: string): Promise<void> {
  await db.update(notifications)
    .set({
      status: 'sent',
      sentAt: new Date(),
    })
    .where(eq(notifications.id, notificationId));
}

/**
 * Marks a notification as failed
 */
export async function markNotificationFailed(
  notificationId: string,
  errorMessage: string
): Promise<void> {
  const notification = await db.query.notifications.findFirst({
    where: eq(notifications.id, notificationId),
  });

  await db.update(notifications)
    .set({
      status: 'failed',
      errorMessage,
      attemptCount: (notification?.attemptCount || 0) + 1,
    })
    .where(eq(notifications.id, notificationId));
}

/**
 * Gets pending notifications for a specific channel
 */
export async function getPendingNotifications(
  channel: NotificationChannel,
  limit: number = 100
): Promise<Notification[]> {
  return db.query.notifications.findMany({
    where: and(
      eq(notifications.status, 'pending'),
      eq(notifications.channel, channel)
    ),
    orderBy: (notifications, { asc }) => [asc(notifications.createdAt)],
    limit,
  });
}

/**
 * Processes pending email notifications
 * This would integrate with your email service (SendGrid, Resend, etc.)
 */
export async function processEmailNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const pending = await getPendingNotifications('email', 50);
  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      // TODO: Integrate with email service
      // await sendEmail({
      //   to: getUserEmail(notification.userId),
      //   subject: notification.subject,
      //   body: notification.body,
      // });

      await markNotificationSent(notification.id);
      sent++;
    } catch (error) {
      await markNotificationFailed(
        notification.id,
        error instanceof Error ? error.message : 'Unknown error'
      );
      failed++;
    }
  }

  return { sent, failed };
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * Generates a notification subject line
 */
function generateNotificationSubject(alert: Alert, listing: Listing): string {
  return `New Rental Match: ${listing.bedrooms}BR in ${listing.neighborhood} - $${listing.price.toLocaleString()}`;
}

/**
 * Generates notification body text
 */
function generateNotificationBody(alert: Alert, listing: Listing): string {
  const feeText = listing.noFee ? 'No Fee' : 'Fee Required';
  const sqftText = listing.sqft ? ` • ${listing.sqft.toLocaleString()} sqft` : '';

  return `
A new listing matching your alert "${alert.name}" is available!

${listing.title}
${listing.address}

${listing.bedrooms} Bedrooms • ${listing.bathrooms} Bathrooms${sqftText}
$${listing.price.toLocaleString()}/month • ${feeText}

View listing: ${listing.listingUrl}
  `.trim();
}

/**
 * Generates HTML notification body
 */
function generateNotificationBodyHtml(alert: Alert, listing: Listing): string {
  const feeText = listing.noFee ? 'No Fee' : 'Fee Required';
  const sqftText = listing.sqft ? ` • ${listing.sqft.toLocaleString()} sqft` : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">New Rental Match!</h2>

      <p style="color: #666;">A new listing matching your alert "<strong>${alert.name}</strong>" is available:</p>

      ${listing.imageUrl ? `<img src="${listing.imageUrl}" alt="${listing.title}" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />` : ''}

      <h3 style="color: #1a1a1a; margin-top: 20px;">${listing.title}</h3>
      <p style="color: #666;">${listing.address}</p>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 8px 0; color: #1a1a1a;">
          <strong>${listing.bedrooms} Bedrooms</strong> •
          <strong>${listing.bathrooms} Bathrooms</strong>${sqftText}
        </p>
        <p style="margin: 8px 0; font-size: 24px; color: #1a1a1a;">
          <strong>$${listing.price.toLocaleString()}/month</strong>
        </p>
        <p style="margin: 8px 0; color: ${listing.noFee ? '#16a34a' : '#666'};">
          ${feeText}
        </p>
      </div>

      <a href="${listing.listingUrl}"
         style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        View Listing
      </a>
    </div>
  `.trim();
}

// ============================================================================
// USER NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Gets user's notification channel preferences
 * For now, returns default channels
 * TODO: Implement user preferences table
 */
export function getUserNotificationChannels(userId: string): NotificationChannel[] {
  // Default to in-app notifications
  // Later can be customized per user
  return ['in_app'];
}

/**
 * Gets user's unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const userNotifications = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.channel, 'in_app'),
      eq(notifications.status, 'pending')
    ),
  });

  return userNotifications.length;
}

/**
 * Gets user's recent notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    limit,
    with: {
      listing: true,
      alert: true,
    },
  });
}
