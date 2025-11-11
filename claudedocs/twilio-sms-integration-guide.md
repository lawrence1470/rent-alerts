# Twilio SMS Integration Guide for Next.js 16 Rental Notifications

## Table of Contents
1. [Getting Started with Twilio](#getting-started-with-twilio)
2. [Next.js Integration](#nextjs-integration)
3. [SMS Sending Implementation](#sms-sending-implementation)
4. [Phone Number Validation](#phone-number-validation)
5. [Production Considerations](#production-considerations)
6. [Code Examples](#code-examples)
7. [Cost Analysis](#cost-analysis)

---

## Getting Started with Twilio

### Account Setup

1. **Create Account**
   - Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - No credit card required for trial account
   - Receive $15.50 trial credit

2. **Get Phone Number**
   - Navigate to Phone Numbers → Manage → Buy a number
   - Choose SMS-enabled long code number
   - **Cost**: $1.15/month (or $0.50/month if you bring your own number)
   - **Recommendation**: Start with a long code for development, upgrade to toll-free ($2.15/month) for production

3. **Locate Credentials**
   - Go to Console Dashboard
   - Find your **Account SID** (starts with `AC...`)
   - Find your **Auth Token** (click "View" to reveal)
   - Copy your **Phone Number** (in E.164 format: +1XXXXXXXXXX)

### Environment Variables

Create or update `.env.local` in your project root:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

**Security Note**: Add `.env.local` to `.gitignore` (Next.js does this by default)

### Installation

Install the official Twilio Node.js SDK:

```bash
npm install twilio
```

**TypeScript Support**: The SDK includes TypeScript definitions (supports TypeScript 2.9+)

---

## Next.js Integration

### Architecture Overview

Your rental notification system should use this architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Cron Job (Vercel Cron)                                │
│  GET /api/cron/check-alerts                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Alert Processing Service                              │
│  - Fetch alerts from DB                                │
│  - Call StreetEasy API                                 │
│  - Deduplicate listings                                │
│  - Create notifications                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  SMS Service (lib/services/sms.service.ts)             │
│  - Format messages                                     │
│  - Send via Twilio API                                 │
│  - Handle errors & retries                             │
└─────────────────────────────────────────────────────────┘
```

### Why Server-Side Only?

**Critical**: Twilio credentials must NEVER be exposed to the client. All SMS operations happen in:
- API Routes (`app/api/**/route.ts`)
- Server Actions
- Cron jobs

---

## SMS Sending Implementation

### SMS Service Layer

Create `lib/services/sms.service.ts`:

```typescript
import twilio from 'twilio';

// Initialize Twilio client (singleton pattern)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing Twilio environment variables');
}

const client = twilio(accountSid, authToken);

// Type definitions
export interface SendSMSParams {
  to: string;           // Recipient phone number (E.164 format)
  body: string;         // Message content
  statusCallback?: string; // Optional webhook for delivery status
}

export interface SMSResponse {
  success: boolean;
  messageSid?: string;  // Twilio message identifier
  error?: string;
  status?: string;      // queued, sending, sent, failed, delivered
}

/**
 * Send SMS via Twilio
 * @param params - SMS parameters
 * @returns Promise<SMSResponse>
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  const { to, body, statusCallback } = params;

  // Validate phone number format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(to)) {
    return {
      success: false,
      error: 'Invalid phone number format. Must be E.164 format (e.g., +15551234567)',
    };
  }

  // Validate message body
  if (!body || body.trim().length === 0) {
    return {
      success: false,
      error: 'Message body cannot be empty',
    };
  }

  // Check message length (160 GSM-7 chars = 1 segment, 70 UCS-2 chars = 1 segment)
  // Messages longer than this are automatically segmented
  const segments = Math.ceil(body.length / 160);
  if (segments > 10) {
    console.warn(`Message is ${segments} segments long. Consider shortening.`);
  }

  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
      ...(statusCallback && { statusCallback }), // Optional delivery tracking
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      to,
    });

    // Map common Twilio error codes to user-friendly messages
    const errorMessage = mapTwilioError(error.code);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send SMS to multiple recipients (batch)
 * @param recipients - Array of phone numbers
 * @param body - Message content
 * @returns Promise<SMSResponse[]>
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string
): Promise<SMSResponse[]> {
  // Send messages in parallel with rate limiting awareness
  const batchSize = 10; // Conservative batch size
  const results: SMSResponse[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((to) => sendSMS({ to, body }))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Format rental notification message
 */
export function formatRentalNotification(listing: {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  url: string;
}): string {
  return `New rental match!

${listing.address}
$${listing.price}/mo | ${listing.bedrooms}bd ${listing.bathrooms}ba

View: ${listing.url}`;
}

/**
 * Map Twilio error codes to user-friendly messages
 */
function mapTwilioError(code: number | undefined): string {
  const errorMap: Record<number, string> = {
    21211: 'Invalid phone number',
    21408: 'Permission denied to send to this number',
    21610: 'Message blocked by carrier',
    21614: 'Invalid mobile number',
    21211: 'Phone number is not valid',
    21608: 'Number not verified (trial account restriction)',
    14107: 'Rate limit exceeded. Please try again later.',
    21611: 'Message queue full for this number',
    20429: 'Too many concurrent requests',
  };

  return errorMap[code || 0] || 'Failed to send SMS. Please try again.';
}
```

### Integration with Notification Service

Update `lib/services/notification.service.ts`:

```typescript
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { sendSMS, formatRentalNotification } from './sms.service';
import { eq } from 'drizzle-orm';

/**
 * Process pending notifications and send SMS
 */
export async function processPendingNotifications() {
  // Fetch pending notifications with user phone numbers
  const pending = await db.query.notifications.findMany({
    where: eq(notifications.status, 'pending'),
    with: {
      user: {
        columns: {
          phoneNumber: true,
        },
      },
      listing: true,
    },
    limit: 100, // Process in batches
  });

  const results = await Promise.allSettled(
    pending.map(async (notification) => {
      if (!notification.user.phoneNumber) {
        // Mark as failed if no phone number
        await db.update(notifications)
          .set({
            status: 'failed',
            sentAt: new Date(),
            metadata: { error: 'No phone number on file' },
          })
          .where(eq(notifications.id, notification.id));
        return;
      }

      // Format message
      const message = formatRentalNotification({
        address: notification.listing.address,
        price: notification.listing.price,
        bedrooms: notification.listing.bedrooms,
        bathrooms: notification.listing.bathrooms,
        url: notification.listing.url,
      });

      // Send SMS
      const result = await sendSMS({
        to: notification.user.phoneNumber,
        body: message,
      });

      // Update notification status
      await db.update(notifications)
        .set({
          status: result.success ? 'sent' : 'failed',
          sentAt: new Date(),
          metadata: {
            messageSid: result.messageSid,
            error: result.error,
          },
        })
        .where(eq(notifications.id, notification.id));
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed, total: pending.length };
}
```

### API Route for Manual Testing

Create `app/api/test-sms/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendSMS } from '@/lib/services/sms.service';

export async function POST(request: Request) {
  // Protect endpoint with authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, body } = await request.json();

    const result = await sendSMS({ to, body });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
        status: result.status,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Phone Number Validation

### E.164 Format

Twilio requires phone numbers in **E.164 format**:
- Format: `+[country code][number]`
- US Example: `+14155552671` (not `(415) 555-2671`)
- Max 15 digits total
- No spaces, dashes, or parentheses

### Basic Validation (Regex)

```typescript
/**
 * Validate E.164 phone number format
 */
export function isValidE164(phoneNumber: string): boolean {
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phoneNumber);
}
```

### Advanced Validation (Twilio Lookup API)

The Twilio Lookup API provides **FREE** basic validation and formatting:

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Validate and format phone number using Twilio Lookup API (FREE)
 * @param phoneNumber - Raw phone number in any format
 * @returns Formatted E.164 number or null if invalid
 */
export async function validateAndFormatPhoneNumber(
  phoneNumber: string
): Promise<{ valid: boolean; e164?: string; error?: string }> {
  try {
    // Lookup API - basic validation is FREE
    const lookup = await client.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch();

    return {
      valid: lookup.valid,
      e164: lookup.phoneNumber,
    };
  } catch (error: any) {
    console.error('Phone validation error:', error);
    return {
      valid: false,
      error: 'Invalid phone number',
    };
  }
}
```

### User Input Formatting

For user-friendly input in your dashboard:

```typescript
/**
 * Format user input to E.164
 * Assumes US numbers if no country code provided
 */
export function formatToE164(input: string): string {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Add +1 for US if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code or invalid length
  return `+${digits}`;
}
```

### Database Schema Update

Add phone number field to users table in `lib/schema.ts`:

```typescript
export const users = pgTable('users', {
  // ... existing fields
  phoneNumber: varchar('phone_number', { length: 20 }), // E.164 format
  phoneVerified: boolean('phone_verified').default(false),
  phoneVerifiedAt: timestamp('phone_verified_at'),
});
```

### React Component for Phone Input

Create `components/ui/phone-input.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    // Format to E.164 on blur
    const formatted = formatToE164(input);
    onChange(formatted);
  };

  return (
    <div>
      <Label htmlFor="phone">Phone Number</Label>
      <Input
        id="phone"
        type="tel"
        placeholder="+1 (555) 123-4567"
        value={displayValue}
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      <p className="text-sm text-muted-foreground mt-1">
        Format: +1 (XXX) XXX-XXXX
      </p>
    </div>
  );
}

function formatToE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
```

---

## Production Considerations

### Environment Variables

**Vercel Deployment**:
1. Go to Project Settings → Environment Variables
2. Add the three Twilio variables
3. Set environment: Production, Preview, Development
4. Redeploy to apply changes

**Local Development**:
- Use `.env.local` for local testing
- Never commit `.env.local` to Git
- Use different Twilio accounts for dev/prod if possible

### Security Best Practices

1. **Never Expose Credentials Client-Side**
   - ❌ Don't: Use Twilio in client components
   - ✅ Do: Use server-side API routes only

2. **Error Handling**
   - Return generic error messages to users
   - Log detailed errors server-side only
   - Monitor failed messages in Twilio Console

3. **Rate Limiting**
   - Implement application-level rate limiting
   - Track SMS sends per user/IP
   - Example with Upstash Rate Limit:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 SMS per hour per user
});

export async function POST(request: Request) {
  const { userId } = await auth();
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // ... send SMS
}
```

4. **Input Validation**
   - Sanitize phone numbers
   - Validate message content
   - Check for spam patterns

### Message Queuing for Bulk Notifications

For high-volume notifications (100+ per batch):

```typescript
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const smsQueue = new Queue('sms-notifications', { connection: redis });

/**
 * Queue SMS for background processing
 */
export async function queueSMS(params: SendSMSParams) {
  await smsQueue.add('send-sms', params, {
    attempts: 3, // Retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
  });
}

/**
 * Process queued SMS messages
 */
export async function processSMSQueue() {
  const worker = new Worker(
    'sms-notifications',
    async (job) => {
      const result = await sendSMS(job.data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    { connection: redis }
  );

  worker.on('completed', (job) => {
    console.log(`SMS sent: ${job.returnvalue.messageSid}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`SMS failed: ${job.id}`, err);
  });
}
```

### Rate Limiting & Throughput

**Twilio Rate Limits**:
- **Long Codes (US)**: 1 message per second (MPS) default
- **Toll-Free**: 3 MPS
- **Short Codes**: 100 MPS
- **Account-based throughput**: Scales with historical usage

**Queue Capacity**:
- Messages queue for up to **10 hours** before auto-failing
- Example calculation for 1,000 notifications:
  - At 1 MPS: 1,000 seconds = ~16.7 minutes
  - With 100% safety buffer: Need 2 MPS capacity

**Scaling Strategy**:
```typescript
/**
 * Calculate required throughput
 */
export function calculateRequiredMPS(
  totalMessages: number,
  targetDeliveryTime: number // seconds
): number {
  const baseMPS = totalMessages / targetDeliveryTime;
  const bufferMultiplier = 2; // 100% safety buffer (Twilio recommendation)
  return Math.ceil(baseMPS * bufferMultiplier);
}

// Example: Deliver 5,000 messages in 15 minutes
const requiredMPS = calculateRequiredMPS(5000, 15 * 60);
console.log(`Need ${requiredMPS} MPS capacity`); // ~12 MPS
```

**Recommendations**:
1. Start with long codes for development (<100 messages/day)
2. Upgrade to toll-free for production (up to 10,000 messages/day)
3. Request throughput increase from Twilio support for higher volume
4. Use Messaging Services to pool phone numbers for higher throughput

### Cost Optimization

1. **Message Segmentation**
   - Keep messages under 160 characters (1 segment)
   - Each segment costs separately
   - Use URL shorteners for links

2. **Batching Strategy**
   - Combine multiple alerts into single message when appropriate
   - Example: "3 new rentals match your criteria. View: [link]"

3. **Delivery Reports**
   - Only request statusCallback webhooks when necessary
   - Free to receive, but add complexity

4. **Phone Number Management**
   - Release unused phone numbers
   - Share numbers across non-conflicting use cases

### Monitoring & Logging

Create a monitoring dashboard:

```typescript
// lib/services/sms-metrics.service.ts
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, count, and, gte, sql } from 'drizzle-orm';

export async function getSMSMetrics(startDate: Date, endDate: Date) {
  const [sent, failed, pending] = await Promise.all([
    db.select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.status, 'sent'),
          gte(notifications.sentAt, startDate)
        )
      ),
    db.select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.status, 'failed'),
          gte(notifications.sentAt, startDate)
        )
      ),
    db.select({ count: count() })
      .from(notifications)
      .where(eq(notifications.status, 'pending')),
  ]);

  const successRate = sent[0].count / (sent[0].count + failed[0].count) * 100;

  return {
    sent: sent[0].count,
    failed: failed[0].count,
    pending: pending[0].count,
    successRate: successRate.toFixed(2),
  };
}
```

### Trial Account Limitations

**Restrictions**:
- Must verify recipient phone numbers before sending
- Limited to verified numbers only
- $15.50 in free credit

**Verification Process**:
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Add recipient phone numbers
3. Recipient receives verification code via SMS
4. Enter code to verify

**Upgrading**:
- Add payment method to remove restrictions
- Send to any valid phone number
- No verification required

---

## Code Examples

### Complete API Route Example

`app/api/notifications/send/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { sendSMS, formatRentalNotification } from '@/lib/services/sms.service';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { notificationId } = await request.json();

    // Fetch notification with listing and user data
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
      with: {
        user: {
          columns: {
            id: true,
            phoneNumber: true,
          },
        },
        listing: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if user has phone number
    if (!notification.user.phoneNumber) {
      return NextResponse.json(
        { error: 'No phone number on file. Please add one in settings.' },
        { status: 400 }
      );
    }

    // Format and send message
    const message = formatRentalNotification({
      address: notification.listing.address,
      price: notification.listing.price,
      bedrooms: notification.listing.bedrooms,
      bathrooms: notification.listing.bathrooms,
      url: notification.listing.url,
    });

    const result = await sendSMS({
      to: notification.user.phoneNumber,
      body: message,
    });

    // Update notification status
    await db.update(notifications)
      .set({
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date(),
        metadata: {
          messageSid: result.messageSid,
          error: result.error,
        },
      })
      .where(eq(notifications.id, notificationId));

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
```

### Cron Job Integration

`app/api/cron/check-alerts/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { processPendingNotifications } from '@/lib/services/notification.service';

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Your existing alert checking logic
    // ... (fetch alerts, call StreetEasy API, create notifications)

    // Send SMS for pending notifications
    const result = await processPendingNotifications();

    return NextResponse.json({
      success: true,
      smsStats: result,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
```

---

## Cost Analysis

### Pricing Breakdown (US Numbers)

**SMS Costs (per message segment)**:
- Long code: $0.0083 per segment (outbound)
- Toll-free: $0.0083 per segment (outbound)
- Short code: $0.0083 per segment (outbound)

**Volume Discounts** (automatic monthly tiers):
| Monthly Volume | Price per Segment |
|----------------|-------------------|
| 1 - 150,000 | $0.0083 |
| 150,001 - 300,000 | $0.0081 |
| 300,001 - 500,000 | $0.0079 |
| 500,001 - 750,000 | $0.0077 |
| 750,001 - 1,000,000 | $0.0075 |
| 1,000,001+ | $0.0073 |

**Phone Number Rental**:
- Long code: $1.15/month
- Toll-free: $2.15/month
- Short code: $1,000/quarter (random) or $1,500/quarter (vanity)

**Additional Services**:
- Basic Lookup API: **FREE** (phone validation/formatting)
- Advanced Lookup (line type): $0.005 per lookup
- Carrier lookup: $0.005 per lookup

### Cost Estimates for Different Usage Levels

#### Scenario 1: Small Scale (Startup)
**Assumptions**:
- 50 users
- 2 notifications per user per week
- 160 characters per message (1 segment)
- 1 long code number

**Monthly Costs**:
```
Messages: 50 users × 2 alerts/week × 4 weeks = 400 messages
Message cost: 400 × $0.0083 = $3.32
Phone number: $1.15
──────────────────────────
Total: $4.47/month
```

#### Scenario 2: Medium Scale (Growing)
**Assumptions**:
- 500 users
- 3 notifications per user per week
- 180 characters per message (2 segments)
- 1 toll-free number

**Monthly Costs**:
```
Messages: 500 × 3 × 4 = 6,000 messages
Segments: 6,000 × 2 = 12,000 segments
Message cost: 12,000 × $0.0083 = $99.60
Phone number: $2.15
──────────────────────────
Total: $101.75/month
```

#### Scenario 3: Large Scale (Established)
**Assumptions**:
- 5,000 users
- 4 notifications per user per week
- 160 characters per message (1 segment)
- 2 toll-free numbers (load balancing)

**Monthly Costs**:
```
Messages: 5,000 × 4 × 4 = 80,000 messages
Message cost: 80,000 × $0.0083 = $664
Phone numbers: 2 × $2.15 = $4.30
──────────────────────────
Total: $668.30/month
```

#### Scenario 4: Enterprise Scale
**Assumptions**:
- 50,000 users
- 3 notifications per user per week
- 160 characters per message (1 segment)
- 5 toll-free numbers
- Volume discount applies (>150K messages)

**Monthly Costs**:
```
Messages: 50,000 × 3 × 4 = 600,000 messages
Discount tier: 150K @ $0.0083 + 150K @ $0.0081 + 300K @ $0.0079
Cost breakdown:
  - First 150K: 150,000 × $0.0083 = $1,245
  - Next 150K: 150,000 × $0.0081 = $1,215
  - Remaining 300K: 300,000 × $0.0079 = $2,370
Message cost: $4,830
Phone numbers: 5 × $2.15 = $10.75
──────────────────────────
Total: $4,840.75/month
```

### Cost per User Metrics

| User Base | Messages/Month | Cost/Month | Cost/User/Month |
|-----------|----------------|------------|-----------------|
| 50 | 400 | $4.47 | $0.089 |
| 500 | 12,000 (2 seg) | $101.75 | $0.204 |
| 5,000 | 80,000 | $668.30 | $0.134 |
| 50,000 | 600,000 | $4,840.75 | $0.097 |

**Key Insight**: Cost per user decreases with scale due to volume discounts.

### Cost Optimization Strategies

1. **Message Length Optimization**
   - Keep messages under 160 characters to avoid segmentation
   - Use URL shorteners (bit.ly, tinyurl) for listing links
   - Template messages efficiently

2. **Smart Batching**
   - Combine multiple listings in one message when possible
   - Example: "3 new matches in Brooklyn. View all: [link]"
   - Reduces messages from 3 to 1

3. **Opt-in Frequency Controls**
   - Let users choose notification frequency (instant, daily digest, weekly)
   - Daily digest reduces messages by ~75%

4. **Progressive Notification Strategy**
   ```
   Priority 1 (Instant SMS): Perfect matches only
   Priority 2 (Daily digest): Good matches
   Priority 3 (Email): All matches
   ```

5. **Phone Number Efficiency**
   - Start with 1 long code, upgrade to toll-free as you grow
   - Only add additional numbers when hitting throughput limits
   - Release unused numbers

### Budget Planning Template

```typescript
// lib/utils/sms-budget.ts

export interface SMSBudgetConfig {
  expectedUsers: number;
  notificationsPerUserPerMonth: number;
  averageSegmentsPerMessage: number;
  phoneNumbers: number;
  phoneNumberType: 'long-code' | 'toll-free';
}

export function calculateMonthlySMSBudget(config: SMSBudgetConfig): {
  totalMessages: number;
  totalSegments: number;
  messageCost: number;
  phoneNumberCost: number;
  totalCost: number;
  costPerUser: number;
} {
  const {
    expectedUsers,
    notificationsPerUserPerMonth,
    averageSegmentsPerMessage,
    phoneNumbers,
    phoneNumberType
  } = config;

  const totalMessages = expectedUsers * notificationsPerUserPerMonth;
  const totalSegments = totalMessages * averageSegmentsPerMessage;

  // Calculate message cost with volume discounts
  let messageCost = 0;
  let remaining = totalSegments;

  const tiers = [
    { limit: 150000, rate: 0.0083 },
    { limit: 150000, rate: 0.0081 },
    { limit: 200000, rate: 0.0079 },
    { limit: 250000, rate: 0.0077 },
    { limit: 250000, rate: 0.0075 },
    { limit: Infinity, rate: 0.0073 },
  ];

  for (const tier of tiers) {
    if (remaining <= 0) break;
    const segments = Math.min(remaining, tier.limit);
    messageCost += segments * tier.rate;
    remaining -= segments;
  }

  const phoneNumberCost = phoneNumbers * (phoneNumberType === 'toll-free' ? 2.15 : 1.15);
  const totalCost = messageCost + phoneNumberCost;
  const costPerUser = totalCost / expectedUsers;

  return {
    totalMessages,
    totalSegments,
    messageCost,
    phoneNumberCost,
    totalCost,
    costPerUser,
  };
}

// Example usage
const budget = calculateMonthlySMSBudget({
  expectedUsers: 1000,
  notificationsPerUserPerMonth: 10,
  averageSegmentsPerMessage: 1.2, // Some messages exceed 160 chars
  phoneNumbers: 1,
  phoneNumberType: 'toll-free',
});

console.log(`Estimated monthly cost: $${budget.totalCost.toFixed(2)}`);
console.log(`Cost per user: $${budget.costPerUser.toFixed(4)}`);
```

---

## Quick Start Checklist

- [ ] Sign up for Twilio account
- [ ] Purchase SMS-enabled phone number
- [ ] Copy Account SID, Auth Token, Phone Number
- [ ] Add environment variables to `.env.local`
- [ ] Install `npm install twilio`
- [ ] Create `lib/services/sms.service.ts`
- [ ] Add phone number field to users table
- [ ] Implement phone input component
- [ ] Update notification service to send SMS
- [ ] Test with your phone number (verify on trial account)
- [ ] Deploy to Vercel with environment variables
- [ ] Monitor SMS metrics in Twilio Console
- [ ] Upgrade account when ready for production

---

## Additional Resources

**Official Documentation**:
- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart/node)
- [Message Resource API](https://www.twilio.com/docs/sms/api/message-resource)
- [Lookup API](https://www.twilio.com/docs/lookup/v2-api)
- [Rate Limits & Queues](https://www.twilio.com/docs/messaging/guides/scaling-queueing-latency)

**Helpful Guides**:
- [E.164 Phone Format](https://www.twilio.com/docs/glossary/what-e164)
- [Messaging Insights](https://www.twilio.com/docs/messaging/insights)
- [Error Codes](https://www.twilio.com/docs/api/errors)

**Community Examples**:
- [Next.js + Twilio Examples](https://github.com/projectashik/nextjs-twilio-send-message)
- [TypeScript Gist](https://gist.github.com/dbredvick/602e398b61ac960e326fdd45dab67f3d)

---

## Summary

Twilio SMS integration with Next.js is straightforward with proper architecture:

1. **Server-side only** - Never expose credentials to client
2. **E.164 formatting** - Validate and format phone numbers correctly
3. **Error handling** - Map Twilio errors to user-friendly messages
4. **Cost-aware** - Monitor usage and optimize message length
5. **Production-ready** - Implement rate limiting, queuing, and monitoring

**Estimated Costs**:
- **Startup** (50 users): ~$5/month
- **Growing** (500 users): ~$100/month
- **Established** (5,000 users): ~$670/month
- **Enterprise** (50,000 users): ~$4,850/month

**Next Steps**:
1. Set up Twilio account and get credentials
2. Implement SMS service layer
3. Add phone number field to user profile
4. Integrate with existing notification service
5. Test thoroughly with trial account
6. Deploy and monitor in production
