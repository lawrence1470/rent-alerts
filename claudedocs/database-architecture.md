# Rental Notification System - Database Architecture

## Overview

This document describes the complete database architecture and API design for the rental notification system. The design prioritizes **cost efficiency** through intelligent alert batching and **serverless optimization** for Vercel deployment.

## Architecture Principles

### 1. Cost-Efficient Batching
**Problem**: Making one API call per alert would be expensive with many users.
**Solution**: Group similar alerts and make one API call per group.

**Example**:
- User A wants: East Village, $2K-3K, 2BR
- User B wants: East Village, $2.5K-3.5K, 2BR
- User C wants: East Village, $2K-4K, 1-2BR

Instead of 3 API calls, we make **1 API call** with criteria:
- Areas: East Village
- Price: $2K-4K (broadest range)
- Beds: 1-2BR (broadest range)

Then filter results locally for each user's specific criteria.

### 2. Deduplication
Track which listings each user has already seen to prevent duplicate notifications.

### 3. Serverless Optimization
- Fast queries with proper indexes
- Connection pooling with Neon HTTP
- No long-running processes
- Efficient cron job execution (<5 min)

## Database Schema

### Core Tables

#### `alerts`
Stores user search criteria for rental notifications.

```typescript
{
  id: uuid,
  userId: string,              // Clerk user ID
  name: string,                // User-friendly name

  // Search Criteria
  areas: string,               // "east-village,west-village"
  minPrice: number | null,
  maxPrice: number | null,
  minBeds: number | null,
  maxBeds: number | null,
  minBaths: number | null,
  noFee: boolean,

  // Status
  isActive: boolean,
  lastChecked: timestamp,

  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes**:
- `userId` - Fast user alert lookup
- `isActive` - Query only active alerts
- `(isActive, areas, minPrice, maxPrice, minBeds, maxBeds)` - Batching optimization

#### `alert_batches`
Represents grouped alerts that can be fetched with a single API call.

```typescript
{
  id: uuid,

  // Batch Criteria (broadest parameters)
  areas: string,
  minPrice: number | null,
  maxPrice: number | null,
  minBeds: number | null,
  maxBeds: number | null,
  minBaths: number | null,
  noFee: boolean,

  // Metadata
  alertCount: number,
  criteriaHash: string,        // SHA-256 hash for deduplication
  lastFetched: timestamp,

  createdAt: timestamp
}
```

**Key Feature**: `criteriaHash` - deterministic hash of search criteria enables efficient batch deduplication.

#### `alert_batch_memberships`
Many-to-many relationship between alerts and batches.

```typescript
{
  id: uuid,
  alertId: uuid → alerts.id,
  batchId: uuid → alert_batches.id,
  createdAt: timestamp
}
```

**Constraint**: `UNIQUE(alertId, batchId)` - prevents duplicate memberships.

#### `listings`
Stores rental listings from StreetEasy API.

```typescript
{
  id: uuid,
  streetEasyId: string,        // External API ID

  // Listing Details
  title: string,
  address: string,
  neighborhood: string,
  price: number,
  bedrooms: number,
  bathrooms: number,
  sqft: number | null,
  noFee: boolean,

  // URLs
  listingUrl: string,
  imageUrl: string | null,

  // Metadata
  rawData: jsonb,              // Full API response
  firstSeenAt: timestamp,
  lastSeenAt: timestamp,
  isActive: boolean,
}
```

**Indexes**:
- `streetEasyId` (UNIQUE) - Fast API ID lookup
- `neighborhood` - Filter by area
- `price` - Price range queries
- `firstSeenAt` - Recent listings

#### `user_seen_listings`
Tracks which listings each user has been notified about.

```typescript
{
  id: uuid,
  userId: string,              // Clerk user ID
  listingId: uuid → listings.id,
  alertId: uuid → alerts.id,
  firstSeenAt: timestamp
}
```

**Constraint**: `UNIQUE(userId, listingId, alertId)` - prevents duplicate tracking.

**Critical for Deduplication**: Before creating notifications, query this table to filter out already-seen listings.

#### `notifications`
Queue of notifications to be sent to users.

```typescript
{
  id: uuid,
  userId: string,
  alertId: uuid → alerts.id,
  listingId: uuid → listings.id,

  // Notification Details
  channel: 'email' | 'in_app' | 'push',
  status: 'pending' | 'sent' | 'failed',
  subject: string | null,
  body: string | null,

  // Error Tracking
  errorMessage: string | null,
  attemptCount: number,

  createdAt: timestamp,
  sentAt: timestamp | null
}
```

**Indexes**:
- `(status, channel, createdAt)` - Efficient pending notification queries
- `userId` - User notification history

#### `cron_job_logs`
Tracks cron job executions for monitoring.

```typescript
{
  id: uuid,
  jobName: string,
  status: 'started' | 'completed' | 'failed',

  // Execution Details
  startedAt: timestamp,
  completedAt: timestamp | null,
  duration: number,              // milliseconds

  // Metrics
  alertsProcessed: number,
  batchesFetched: number,
  newListingsFound: number,
  notificationsCreated: number,

  // Error Tracking
  errorMessage: string | null,
  errorStack: string | null
}
```

## Core Services

### 1. Alert Batching Service
**Location**: `lib/services/alert-batching.service.ts`

**Key Functions**:
- `groupAlertsIntoBatches()` - Groups alerts by area and creates batched search criteria
- `persistBatches()` - Saves batch configuration to database
- `getActiveBatches()` - Retrieves all active batches for cron job
- `listingMatchesAlert()` - Local filtering after batch fetch
- `rebuildAllBatches()` - Rebuilds batch structure (call after alert changes)

**Algorithm**:
```typescript
// Step 1: Group by area combinations
Map<string, Alert[]> areaGroups

// Step 2: For each group, find broadest criteria
broadestCriteria = {
  minPrice: min(all alerts' minPrice),
  maxPrice: max(all alerts' maxPrice),
  // ... similar for other fields
}

// Step 3: Hash criteria for deduplication
criteriaHash = SHA256(JSON.stringify(sortedCriteria))
```

### 2. StreetEasy API Service
**Location**: `lib/services/streeteasy-api.service.ts`

**Key Functions**:
- `searchRentals()` - Calls StreetEasy API with search parameters
- `fetchBatch()` - Fetches listings for a batch criteria
- `transformResponse()` - Normalizes API response to internal format

**Configuration**:
```env
RAPIDAPI_KEY=your_key_here
```

### 3. Listing Deduplication Service
**Location**: `lib/services/listing-deduplication.service.ts`

**Key Functions**:
- `upsertListings()` - Saves listings to database (update if exists)
- `getSeenListingIds()` - Gets listing IDs user has already seen
- `filterNewListings()` - Removes already-seen listings
- `markListingsAsSeen()` - Records that user has been notified
- `batchFilterNewListings()` - Efficient bulk deduplication

### 4. Notification Service
**Location**: `lib/services/notification.service.ts`

**Key Functions**:
- `createNotification()` - Creates single notification
- `createBulkNotifications()` - Batch notification creation
- `generateNotificationsForAlert()` - Creates notifications for matched listings
- `getUserNotifications()` - Retrieves user's notification history
- `processEmailNotifications()` - Sends pending email notifications

### 5. Cron Job Service
**Location**: `lib/services/cron-job.service.ts`

**Main Function**: `checkAllAlerts()`

**Execution Flow**:
```
1. Get all active batches from database
2. For each batch:
   a. Fetch listings from StreetEasy API
   b. Upsert listings to database
   c. Get all alerts in this batch
   d. For each alert:
      - Filter listings matching alert criteria
      - Remove already-seen listings
      - Create notifications
      - Mark listings as seen
      - Update alert.lastChecked
   e. Update batch.lastFetched
3. Log execution metrics
```

**Performance**: Optimized to complete within 5 minutes for 1000+ alerts.

## API Routes

### Alert Management

#### `GET /api/alerts`
List user's alerts.

**Response**:
```json
{
  "alerts": [
    {
      "id": "uuid",
      "name": "East Village 2BR",
      "areas": "east-village",
      "minPrice": 2000,
      "maxPrice": 3000,
      "minBeds": 2,
      "maxBeds": 2,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastChecked": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### `POST /api/alerts`
Create new alert.

**Request**:
```json
{
  "name": "East Village 2BR",
  "areas": "east-village,west-village",
  "minPrice": 2000,
  "maxPrice": 3000,
  "minBeds": 2,
  "maxBeds": 2,
  "minBaths": 1,
  "noFee": false,
  "isActive": true
}
```

**Side Effect**: Triggers `rebuildAllBatches()` to optimize batch structure.

#### `PATCH /api/alerts/[id]`
Update existing alert.

**Request**: Partial alert object.
**Side Effect**: Triggers `rebuildAllBatches()`.

#### `DELETE /api/alerts/[id]`
Delete alert.

**Side Effect**: Triggers `rebuildAllBatches()`.

### Notifications

#### `GET /api/notifications`
Get user's notifications.

**Query Parameters**:
- `limit`: number (default: 20)
- `unreadOnly`: boolean (default: false)

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "alertId": "uuid",
      "listingId": "uuid",
      "channel": "in_app",
      "status": "pending",
      "subject": "New Rental Match: 2BR in East Village",
      "body": "A new listing...",
      "createdAt": "2024-01-01T12:00:00Z",
      "listing": { /* full listing object */ },
      "alert": { /* full alert object */ }
    }
  ],
  "unreadCount": 5
}
```

#### `PATCH /api/notifications`
Mark notifications as read.

**Request**:
```json
{
  "notificationIds": ["uuid1", "uuid2"],
  // OR
  "markAllRead": true
}
```

### Cron Job

#### `GET /api/cron/check-alerts`
Main cron endpoint (called by Vercel Cron every 15 minutes).

**Security**: Requires `Authorization: Bearer <CRON_SECRET>` header.

**Response**:
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

## Vercel Configuration

### Environment Variables
```env
# Required
DATABASE_URL=postgresql://...           # Neon Postgres connection string
RAPIDAPI_KEY=your_key_here             # StreetEasy API key
CRON_SECRET=your_random_secret_here    # Cron job authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...  # Clerk public key
CLERK_SECRET_KEY=...                   # Clerk secret key

# Optional
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Vercel Cron Setup
**File**: `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/check-alerts",
    "schedule": "0/15 * * * *"
  }]
}
```

**Schedule**: Every 15 minutes (adjustable based on needs).

## Performance Characteristics

### Expected Metrics (1000 Active Alerts)

**Without Batching**:
- API Calls: 1000
- Execution Time: ~10 minutes
- Cost: High

**With Batching** (this architecture):
- API Calls: ~10-50 (depends on alert diversity)
- Execution Time: ~1-3 minutes
- Cost: **90-95% reduction**

### Query Performance
All critical queries use proper indexes:
- Alert lookup: <10ms
- Seen listings check: <20ms
- Batch retrieval: <50ms
- Notification creation: <100ms (bulk)

### Scalability
- **100 alerts**: 1-2 batches, <30s execution
- **1,000 alerts**: 10-50 batches, <3min execution
- **10,000 alerts**: 100-500 batches, <15min execution (may need optimization)

## Security Considerations

### Authentication
- All user-facing endpoints protected by Clerk auth
- Cron endpoint protected by `CRON_SECRET` token
- User data isolated by `userId` in all queries

### Authorization
- Users can only access their own alerts
- Users can only see their own notifications
- Database queries always filter by `userId`

### Data Protection
- No PII stored beyond Clerk `userId`
- Listing URLs are public StreetEasy links
- No payment information stored

## Database Migrations

### Using Drizzle Kit

**Install**:
```bash
npm install -D drizzle-kit
```

**Generate Migration**:
```bash
npx drizzle-kit generate:pg
```

**Push to Database**:
```bash
npx drizzle-kit push:pg
```

**Configuration**: `drizzle.config.ts`
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Monitoring & Debugging

### Cron Job Monitoring
Query `cron_job_logs` table to track execution history:

```sql
SELECT
  job_name,
  status,
  duration,
  alerts_processed,
  new_listings_found,
  started_at
FROM cron_job_logs
ORDER BY started_at DESC
LIMIT 20;
```

### Performance Analysis
```sql
-- Average batch size
SELECT AVG(alert_count) as avg_batch_size
FROM alert_batches;

-- Most active alerts
SELECT
  a.name,
  COUNT(n.id) as notification_count
FROM alerts a
LEFT JOIN notifications n ON a.id = n.alert_id
GROUP BY a.id, a.name
ORDER BY notification_count DESC;
```

### Error Investigation
```sql
-- Failed cron jobs
SELECT
  started_at,
  duration,
  error_message,
  error_stack
FROM cron_job_logs
WHERE status = 'failed'
ORDER BY started_at DESC;

-- Failed notifications
SELECT
  n.*,
  l.title as listing_title,
  a.name as alert_name
FROM notifications n
JOIN listings l ON n.listing_id = l.id
JOIN alerts a ON n.alert_id = a.id
WHERE n.status = 'failed'
ORDER BY n.created_at DESC;
```

## Future Enhancements

### Phase 2
- [ ] User notification preferences (email vs in-app)
- [ ] Email notification templates with HTML
- [ ] Push notifications (web push API)
- [ ] Alert statistics dashboard

### Phase 3
- [ ] Saved searches with custom names
- [ ] Favorite listings
- [ ] Notification scheduling (quiet hours)
- [ ] SMS notifications (Twilio)

### Phase 4
- [ ] Machine learning for better matching
- [ ] Price trend analysis
- [ ] Neighborhood recommendations
- [ ] Listing comparison tools

## Troubleshooting

### Common Issues

**Issue**: Cron job failing with timeout
**Solution**: Reduce `maxDuration` or optimize batch size

**Issue**: Duplicate notifications
**Solution**: Verify `user_seen_listings` unique constraint is active

**Issue**: Stale listings
**Solution**: Run `markStaleListingsInactive()` periodically

**Issue**: High API costs
**Solution**: Verify batching is working, check `alert_batches` table

## Contact & Support

For questions or issues, contact the development team or file an issue in the project repository.
