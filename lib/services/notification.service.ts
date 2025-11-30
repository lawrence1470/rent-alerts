/**
 * Notification Service
 *
 * Handles creating and sending notifications to users
 */

import { db } from '../db';
import { notifications, type Alert, type Listing, type Notification } from '../schema';
import { eq, and } from 'drizzle-orm';
import { sendSMS, formatRentalNotificationSMS, isSMSEnabled } from './sms.service';
import { sendEmail, formatRentalNotificationEmail, formatDigestEmail, isEmailEnabled } from './email.service';

// ============================================================================
// TYPES
// ============================================================================
export type NotificationChannel = 'email' | 'in_app' | 'push' | 'sms';

export interface NotificationData {
  userId: string;
  alertId: string;
  listingId: string;
  channel: NotificationChannel;
  subject?: string;
  body?: string;
  phoneNumber?: string; // For SMS notifications
  twilioMessageSid?: string; // Twilio message identifier
  emailAddress?: string; // For email notifications
  resendMessageId?: string; // Resend message identifier
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
    phoneNumber: data.phoneNumber,
    twilioMessageSid: data.twilioMessageSid,
    emailAddress: data.emailAddress,
    resendMessageId: data.resendMessageId,
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

  // Get user contact info from local database instead of Clerk API
  let phoneNumber: string | undefined;
  let emailAddress: string | undefined;

  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, alert.userId),
    });

    if (!user) {
      console.error(`User not found in database: ${alert.userId}`);
      // Fallback: user might not be synced yet, skip for now
      return [];
    }

    phoneNumber = user.phoneNumber || undefined;
    emailAddress = user.email;
  } catch (error) {
    console.error(`Error fetching user from database for ${channel}:`, error);
    return [];
  }

  const notificationsData: NotificationData[] = await Promise.all(
    newListings.map(async (listing) => {
      const baseData: NotificationData = {
        userId: alert.userId,
        alertId: alert.id,
        listingId: listing.id,
        channel,
      };

      // Use different formatting based on channel
      if (channel === 'sms') {
        return {
          ...baseData,
          body: formatRentalNotificationSMS({
            address: listing.address,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            url: listing.listingUrl,
            neighborhood: listing.neighborhood,
          }),
          phoneNumber,
        };
      } else if (channel === 'email') {
        const { subject } = await formatRentalNotificationEmail(listing, alert);
        return {
          ...baseData,
          subject,
          body: `Email notification for ${listing.address}`, // Store plain text for reference
          emailAddress,
        };
      } else {
        return {
          ...baseData,
          subject: generateNotificationSubject(alert, listing),
          body: generateNotificationBody(alert, listing),
        };
      }
    })
  );

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
 * Batches notifications by user+alert to send ONE digest email per alert
 */
export async function processEmailNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.warn('Email not enabled - Resend not configured');
    return { sent: 0, failed: 0 };
  }

  const pending = await getPendingNotifications('email', 100);
  if (pending.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Group notifications by userId + alertId
  const groups = new Map<string, Notification[]>();
  for (const notification of pending) {
    const key = `${notification.userId}:${notification.alertId}`;
    const group = groups.get(key) || [];
    group.push(notification);
    groups.set(key, group);
  }

  console.log(`[EMAIL] Processing ${pending.length} notifications in ${groups.size} digest(s)`);

  let sent = 0;
  let failed = 0;
  const { listings: listingsTable, alerts: alertsTable } = await import('../schema');

  // Process each group as a single digest email
  for (const [key, groupNotifications] of groups) {
    try {
      const [userId, alertId] = key.split(':');

      // Get user email
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (!user || !user.email) {
        throw new Error('User or email not found in database');
      }

      // Get alert info
      const alert = await db.query.alerts.findFirst({
        where: eq(alertsTable.id, alertId),
      });

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Fetch all listings for this group
      const listingIds = groupNotifications.map(n => n.listingId);
      const listings: Listing[] = [];

      for (const listingId of listingIds) {
        const listing = await db.query.listings.findFirst({
          where: eq(listingsTable.id, listingId),
        });
        if (listing) {
          listings.push(listing);
        }
      }

      if (listings.length === 0) {
        throw new Error('No listings found for notifications');
      }

      // Format and send digest email
      console.log(`[EMAIL] Formatting digest for ${listings.length} listings...`);
      const { subject, html } = await formatDigestEmail(listings, alert);
      console.log(`[EMAIL] Subject: ${subject}, HTML length: ${html?.length || 0}`);

      const result = await sendEmail({
        to: user.email,
        subject,
        html,
      });

      if (result.success) {
        // Mark all notifications in group as sent
        const sentAt = new Date();
        for (const notification of groupNotifications) {
          await db.update(notifications)
            .set({
              status: 'sent',
              sentAt,
              resendMessageId: result.messageId,
              emailAddress: user.email,
            })
            .where(eq(notifications.id, notification.id));
        }

        console.log(`[EMAIL] Sent digest with ${listings.length} listings to ${user.email}`);
        sent += groupNotifications.length;
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EMAIL] Digest failed: ${errorMessage}`);

      // Mark all notifications in group as failed
      for (const notification of groupNotifications) {
        await markNotificationFailed(notification.id, errorMessage);
      }
      failed += groupNotifications.length;
    }

    // Delay between digest emails (Resend rate limit)
    await new Promise(resolve => setTimeout(resolve, 550));
  }

  return { sent, failed };
}

/**
 * Processes pending SMS notifications
 * Integrates with Twilio SMS service
 */
export async function processSMSNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  // Check if SMS is enabled
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio not configured');
    return { sent: 0, failed: 0 };
  }

  const pending = await getPendingNotifications('sms', 50);
  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      // Ensure phone number exists
      if (!notification.phoneNumber) {
        throw new Error('No phone number provided for SMS notification');
      }

      // Ensure body exists
      if (!notification.body) {
        throw new Error('No message body provided for SMS notification');
      }

      // Send SMS via Twilio
      const result = await sendSMS({
        to: notification.phoneNumber,
        body: notification.body,
      });

      if (result.success) {
        // Update notification with Twilio message SID
        await db.update(notifications)
          .set({
            status: 'sent',
            sentAt: new Date(),
            twilioMessageSid: result.messageSid,
          })
          .where(eq(notifications.id, notification.id));

        sent++;
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
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
 * Gets user's notification channel preferences based on alert settings
 * Checks alert preferences for enablePhoneNotifications and enableEmailNotifications
 */
export async function getUserNotificationChannels(
  alert: Alert
): Promise<NotificationChannel[]> {
  const channels: NotificationChannel[] = ['in_app']; // Always include in-app

  // Add email if enabled
  if (alert.enableEmailNotifications) {
    channels.push('email');
  }

  // Add SMS if enabled and user has phone number
  if (alert.enablePhoneNotifications) {
    try {
      // Check if user has phone number in local database
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, alert.userId),
      });

      if (user && user.phoneNumber) {
        channels.push('sms');
      }
    } catch (error) {
      console.error('Error fetching user phone number from database:', error);
      // Skip SMS if we can't fetch phone number
    }
  }

  return channels;
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
