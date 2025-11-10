# Email Notification Examples and Usage

Quick reference guide for using the email notification feature.

## Testing Email Notifications

### 1. Test Simple Configuration Email

Sends a basic test email to verify Resend is working:

```bash
# Using curl
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "email": "your@email.com",
    "testType": "simple"
  }'
```

**Expected Result:**
- Email with subject "Test Email from Rent Notifications"
- Simple HTML message confirming configuration

### 2. Test Rental Notification Email

Sends a realistic rental notification with sample data:

```bash
# Using curl
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "email": "your@email.com",
    "testType": "rental"
  }'
```

**Expected Result:**
- Email with subject "[TEST] New Rental Match: 2BR in East Village - $3,500"
- Full rental notification layout with sample listing
- Professional HTML design with image, details, and CTA

### 3. Check Service Status

Verify email service is configured correctly:

```bash
curl http://localhost:3000/api/notifications/test-email \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

**Expected Response:**
```json
{
  "emailServiceEnabled": true,
  "resendConfigured": true,
  "status": "operational"
}
```

## Sample Email Templates

### Simple Test Email

```
Subject: Test Email from Rent Notifications

Email Configuration Test
This is a test email from your Rent Notifications system.
If you're receiving this, your email integration is working correctly!

─────────────────────────────────
This email was sent from your Rent Notifications application.
```

### Rental Notification Email

```
Subject: New Rental Match: 2BR in East Village - $3,500

────────────────────────────────────────────────

New Rental Match!

A new listing matching your alert "East Village 2BR under $4,000"
is now available:

[Listing Image]

Beautiful 2BR Apartment in East Village
123 E 10th Street, Apt 4B
East Village

┌─────────────────────────────────┐
│ 2 Bedrooms • 1.5 Bathrooms     │
│ 900 sqft                        │
│                                 │
│ $3,500/month                    │
│                                 │
│ No Fee                          │
└─────────────────────────────────┘

[View Listing Button]

────────────────────────────────────────────────

You're receiving this email because you created a rental alert.
To manage your alerts or adjust notification settings, visit your
dashboard.

Rent Notifications - Never miss your perfect apartment
```

## Code Examples

### Sending Email Programmatically

```typescript
import { sendEmail, formatRentalNotificationEmail } from '@/lib/services/email.service';
import { db } from '@/lib/db';

// Get listing and alert from database
const listing = await db.query.listings.findFirst({
  where: eq(listings.id, listingId)
});

const alert = await db.query.alerts.findFirst({
  where: eq(alerts.id, alertId)
});

// Format and send email
const { subject, html } = formatRentalNotificationEmail(listing, alert);

const result = await sendEmail({
  to: 'user@example.com',
  subject,
  html,
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Processing Pending Email Notifications

```typescript
import { processEmailNotifications } from '@/lib/services/notification.service';

// Process all pending email notifications
const stats = await processEmailNotifications();

console.log(`Emails sent: ${stats.sent}`);
console.log(`Emails failed: ${stats.failed}`);
```

### Creating Email Notification

```typescript
import { generateNotificationsForAlert } from '@/lib/services/notification.service';

// Get new listings for an alert
const newListings = await getNewListingsForAlert(alert);

// Generate email notifications
const notifications = await generateNotificationsForAlert(
  alert,
  newListings,
  'email'  // channel
);

console.log(`Created ${notifications.length} email notifications`);
```

### Custom Email Template

```typescript
import { sendEmail } from '@/lib/services/email.service';

const customHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Custom Email</h2>
    <p>Your custom content here...</p>
  </div>
`;

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email Subject',
  html: customHtml,
});
```

## Common Use Cases

### 1. Enable Email Notifications for Alert

```typescript
import { db } from '@/lib/db';
import { alerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

await db.update(alerts)
  .set({ enableEmailNotifications: true })
  .where(eq(alerts.id, alertId));
```

### 2. Disable Email Notifications for Alert

```typescript
await db.update(alerts)
  .set({ enableEmailNotifications: false })
  .where(eq(alerts.id, alertId));
```

### 3. Get Email Notification History

```typescript
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

const emailNotifications = await db.query.notifications.findMany({
  where: and(
    eq(notifications.userId, userId),
    eq(notifications.channel, 'email')
  ),
  orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
  limit: 50,
});
```

### 4. Check Email Delivery Status

```typescript
const notification = await db.query.notifications.findFirst({
  where: eq(notifications.id, notificationId)
});

if (notification.status === 'sent') {
  console.log('Email delivered:', notification.resendMessageId);
} else if (notification.status === 'failed') {
  console.log('Email failed:', notification.errorMessage);
} else {
  console.log('Email pending');
}
```

### 5. Resend Failed Email

```typescript
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { processEmailNotifications } from '@/lib/services/notification.service';

// Reset failed notification to pending
await db.update(notifications)
  .set({
    status: 'pending',
    errorMessage: null,
    attemptCount: 0,
  })
  .where(eq(notifications.id, notificationId));

// Process pending notifications
await processEmailNotifications();
```

## Monitoring Queries

### Email Delivery Rate (Last 24 Hours)

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent
FROM notifications
WHERE channel = 'email'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### Most Common Email Errors

```sql
SELECT
  error_message,
  COUNT(*) as error_count
FROM notifications
WHERE channel = 'email'
  AND status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY error_count DESC
LIMIT 10;
```

### Email Notifications by User

```sql
SELECT
  user_id,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM notifications
WHERE channel = 'email'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_emails DESC
LIMIT 20;
```

### Average Email Delivery Time

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_seconds,
  MIN(EXTRACT(EPOCH FROM (sent_at - created_at))) as min_seconds,
  MAX(EXTRACT(EPOCH FROM (sent_at - created_at))) as max_seconds
FROM notifications
WHERE channel = 'email'
  AND status = 'sent'
  AND sent_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days';
```

## Debugging Tips

### Check Email Service Configuration

```typescript
import { getEmailServiceStatus } from '@/lib/services/email.service';

const status = getEmailServiceStatus();
console.log('Email enabled:', status.enabled);
console.log('API key present:', status.apiKeyPresent);
```

### Test Email Validation

```typescript
import { validateEmailAddress } from '@/lib/services/email.service';

console.log(validateEmailAddress('valid@example.com'));    // true
console.log(validateEmailAddress('invalid'));              // false
console.log(validateEmailAddress('no-at-sign.com'));       // false
```

### Check Resend Client

```typescript
import { isEmailEnabled } from '@/lib/services/email.service';

if (!isEmailEnabled()) {
  console.error('Resend not configured. Set RESEND_API_KEY environment variable.');
}
```

### Log Email Sending

```typescript
import { sendEmail } from '@/lib/services/email.service';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});

console.log('Send result:', JSON.stringify(result, null, 2));
```

## Best Practices

1. **Always validate email addresses** before sending
2. **Handle errors gracefully** - don't let email failures block other operations
3. **Monitor delivery rates** - set up alerts for high failure rates
4. **Test in development** before deploying to production
5. **Use the test endpoint** for manual verification
6. **Log important events** for debugging
7. **Respect user preferences** - check `enableEmailNotifications` flag
8. **Include unsubscribe links** (coming in future update)
9. **Keep templates mobile-responsive**
10. **Monitor rate limits** and adjust batch processing if needed

---

For more details, see the main implementation documentation:
`claudedocs/email-notification-implementation.md`
