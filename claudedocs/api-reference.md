# API Reference - Rental Notification System

## Authentication

All user-facing endpoints require Clerk authentication via session cookies or Bearer tokens.

```typescript
// Middleware automatically handles auth via @clerk/nextjs/server
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Endpoints

### Alerts

#### `GET /api/alerts`
List all alerts for the authenticated user.

**Request**:
```bash
curl https://your-app.vercel.app/api/alerts \
  -H "Authorization: Bearer <token>"
```

**Response** (200):
```json
{
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user_2abc...",
      "name": "East Village 2BR No Fee",
      "areas": "east-village",
      "minPrice": 2000,
      "maxPrice": 3000,
      "minBeds": 2,
      "maxBeds": 2,
      "minBaths": 1,
      "noFee": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "lastChecked": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### `POST /api/alerts`
Create a new rental alert.

**Request**:
```bash
curl -X POST https://your-app.vercel.app/api/alerts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "West Village Studio",
    "areas": "west-village,greenwich-village",
    "minPrice": 1500,
    "maxPrice": 2500,
    "minBeds": 0,
    "maxBeds": 1,
    "minBaths": 1,
    "noFee": false,
    "isActive": true
  }'
```

**Request Body**:
```typescript
{
  name: string;              // Required: User-friendly alert name
  areas: string;             // Required: Comma-separated neighborhoods
  minPrice?: number;         // Optional: Minimum monthly rent
  maxPrice?: number;         // Optional: Maximum monthly rent
  minBeds?: number;          // Optional: Minimum bedrooms
  maxBeds?: number;          // Optional: Maximum bedrooms
  minBaths?: number;         // Optional: Minimum bathrooms
  noFee?: boolean;           // Optional: Only no-fee listings (default: false)
  isActive?: boolean;        // Optional: Active status (default: true)
}
```

**Response** (201):
```json
{
  "success": true,
  "alert": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_2abc...",
    "name": "West Village Studio",
    "areas": "west-village,greenwich-village",
    "minPrice": 1500,
    "maxPrice": 2500,
    "minBeds": 0,
    "maxBeds": 1,
    "minBaths": 1,
    "noFee": false,
    "isActive": true,
    "createdAt": "2024-01-15T14:30:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "lastChecked": null
  }
}
```

**Side Effects**:
- Triggers `rebuildAllBatches()` to optimize API call batching
- Alert will be included in next cron job run

**Errors**:
- 400: Missing required fields
- 401: Unauthorized
- 500: Server error

#### `GET /api/alerts/[id]`
Get a specific alert by ID.

**Request**:
```bash
curl https://your-app.vercel.app/api/alerts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Response** (200):
```json
{
  "alert": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "East Village 2BR",
    ...
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Alert not found or doesn't belong to user
- 500: Server error

#### `PATCH /api/alerts/[id]`
Update an existing alert.

**Request**:
```bash
curl -X PATCH https://your-app.vercel.app/api/alerts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "maxPrice": 3500,
    "isActive": true
  }'
```

**Request Body**: Partial alert object (all fields optional)

**Response** (200):
```json
{
  "success": true,
  "alert": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "maxPrice": 3500,
    "updatedAt": "2024-01-15T15:00:00Z",
    ...
  }
}
```

**Side Effects**:
- Triggers `rebuildAllBatches()`
- `updatedAt` timestamp updated

**Errors**:
- 401: Unauthorized
- 404: Alert not found
- 500: Server error

#### `DELETE /api/alerts/[id]`
Delete an alert.

**Request**:
```bash
curl -X DELETE https://your-app.vercel.app/api/alerts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Response** (200):
```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

**Side Effects**:
- Triggers `rebuildAllBatches()`
- Cascades to delete related records:
  - `alert_batch_memberships`
  - `user_seen_listings`
  - `notifications`

**Errors**:
- 401: Unauthorized
- 404: Alert not found
- 500: Server error

---

### Notifications

#### `GET /api/notifications`
Get notifications for the authenticated user.

**Request**:
```bash
# Get all notifications
curl https://your-app.vercel.app/api/notifications \
  -H "Authorization: Bearer <token>"

# Get only unread
curl https://your-app.vercel.app/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer <token>"

# Limit results
curl https://your-app.vercel.app/api/notifications?limit=10 \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**:
- `limit` (number, default: 20): Maximum notifications to return
- `unreadOnly` (boolean, default: false): Only return unread notifications

**Response** (200):
```json
{
  "notifications": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "user_2abc...",
      "alertId": "550e8400-e29b-41d4-a716-446655440000",
      "listingId": "770e8400-e29b-41d4-a716-446655440002",
      "channel": "in_app",
      "status": "pending",
      "subject": "New Rental Match: 2BR in East Village - $2,800",
      "body": "A new listing matching your alert...",
      "errorMessage": null,
      "attemptCount": 0,
      "createdAt": "2024-01-15T12:15:00Z",
      "sentAt": null,
      "listing": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "streetEasyId": "se-12345",
        "title": "Spacious 2BR in Prime East Village",
        "address": "123 E 10th St, New York, NY 10003",
        "neighborhood": "east-village",
        "price": 2800,
        "bedrooms": 2,
        "bathrooms": 1,
        "sqft": 950,
        "noFee": true,
        "listingUrl": "https://streeteasy.com/rental/...",
        "imageUrl": "https://cdn.streeteasy.com/...",
        "firstSeenAt": "2024-01-15T12:00:00Z"
      },
      "alert": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "East Village 2BR"
      }
    }
  ],
  "unreadCount": 5
}
```

**Errors**:
- 401: Unauthorized
- 500: Server error

#### `PATCH /api/notifications`
Mark notifications as read.

**Request (Mark specific notifications)**:
```bash
curl -X PATCH https://your-app.vercel.app/api/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationIds": [
      "660e8400-e29b-41d4-a716-446655440001",
      "660e8400-e29b-41d4-a716-446655440002"
    ]
  }'
```

**Request (Mark all as read)**:
```bash
curl -X PATCH https://your-app.vercel.app/api/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "markAllRead": true }'
```

**Request Body**:
```typescript
{
  notificationIds?: string[];  // Specific notification IDs to mark as read
  markAllRead?: boolean;       // Mark all user's pending notifications as read
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Notifications marked as read"
}
```

**Side Effects**:
- Updates `status` to "sent"
- Sets `sentAt` timestamp

**Errors**:
- 400: Invalid request body
- 401: Unauthorized
- 500: Server error

---

### Cron Jobs

#### `GET /api/cron/check-alerts`
Main cron job endpoint - checks all active alerts for new listings.

**IMPORTANT**: This endpoint is called by Vercel Cron automatically every 15 minutes.

**Request**:
```bash
curl https://your-app.vercel.app/api/cron/check-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Authentication**:
- Requires `Authorization: Bearer <CRON_SECRET>` header
- `CRON_SECRET` must match environment variable

**Response** (200):
```json
{
  "success": true,
  "message": "Alert check completed successfully",
  "stats": {
    "alertsProcessed": 150,
    "batchesFetched": 12,
    "newListingsFound": 8,
    "notificationsCreated": 24,
    "duration": 45000
  }
}
```

**Response Fields**:
- `alertsProcessed`: Number of active alerts checked
- `batchesFetched`: Number of API calls made to StreetEasy
- `newListingsFound`: Number of new unique listings discovered
- `notificationsCreated`: Number of notifications queued
- `duration`: Execution time in milliseconds

**Error Response** (500):
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Execution Flow**:
1. Retrieve all active alert batches from database
2. For each batch:
   - Fetch listings from StreetEasy API
   - Upsert listings to database
   - Get all alerts in batch
   - Filter listings for each alert's criteria
   - Remove already-seen listings per user
   - Create notifications for new matches
   - Mark listings as seen
   - Update timestamps
3. Log execution metrics to `cron_job_logs` table

**Performance**:
- Expected: <3 minutes for 1000 alerts
- Max duration: 5 minutes (Vercel function limit)
- Optimized via batching: 90-95% reduction in API calls

**Monitoring**:
Query `cron_job_logs` table to track execution history.

**Errors**:
- 401: Unauthorized (invalid CRON_SECRET)
- 500: Execution error (see `cron_job_logs` for details)

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing/invalid auth)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (server-side issue)

---

## Rate Limits

### User API Endpoints
- No explicit rate limits (protected by Clerk)
- Recommended: Implement client-side debouncing

### Cron Endpoint
- Called every 15 minutes by Vercel Cron
- Manual calls limited by CRON_SECRET authentication

### StreetEasy API
- RapidAPI tier-dependent
- Monitor usage in RapidAPI dashboard
- Batching minimizes calls (10-50 calls per 15min for 1000 alerts)

---

## WebSocket Support

**Status**: Not implemented yet

**Future**: Real-time notification delivery via WebSocket or Server-Sent Events (SSE).

---

## Webhook Support

**Status**: Not implemented yet

**Future**: Webhook notifications for external integrations.

---

## Type Definitions

All TypeScript types are exported from `lib/schema.ts`:

```typescript
import type {
  Alert,
  NewAlert,
  Listing,
  Notification,
  CronJobLog
} from '@/lib/schema';
```

---

## SDK / Client Library

**Status**: Not implemented yet

**Future**: TypeScript SDK for easier API integration.

**Current Approach**: Use `fetch` or `axios` directly:

```typescript
// Example: Create alert
const response = await fetch('/api/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: 'East Village 2BR',
    areas: 'east-village',
    minPrice: 2000,
    maxPrice: 3000,
  }),
});

const data = await response.json();
```

---

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Test endpoints
curl http://localhost:3000/api/alerts

# Test cron job
curl http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Production Testing
```bash
# Use Vercel URL
curl https://your-app.vercel.app/api/alerts \
  -H "Authorization: Bearer <token>"
```

---

## Support

For issues or questions about the API:
1. Check this reference document
2. Review `claudedocs/database-architecture.md`
3. Check application logs in Vercel dashboard
4. Review database logs in Neon console
