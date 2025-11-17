# Audit Logging System - Complete Guide

## Overview

Comprehensive error tracking and system event logging for the rental notifications application. This system provides detailed insights into API errors, external service failures, cron job issues, and user-facing problems.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [Integration Patterns](#integration-patterns)
5. [Query & Analysis](#query--analysis)
6. [Data Retention](#data-retention)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Architecture

### Design Principles

1. **Non-blocking**: Audit logging never breaks primary operations
2. **Privacy-first**: Automatically anonymizes sensitive data (IPs, phone numbers)
3. **Performance-optimized**: Minimal overhead on critical paths
4. **Context-rich**: Captures relevant metadata for debugging
5. **Retention-aware**: Automatic cleanup based on log severity

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
├─────────────────────────────────────────────────────────┤
│  API Routes  │  Services  │  Webhooks  │  Cron Jobs     │
├─────────────────────────────────────────────────────────┤
│              Audit Middleware & Service                  │
│  • Error Capturing  • Context Extraction                │
│  • Privacy Sanitization  • Performance Tracking          │
├─────────────────────────────────────────────────────────┤
│                   Database Layer                         │
│            audit_logs table (Neon Postgres)             │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,

  -- Classification
  level text NOT NULL,      -- debug, info, warn, error, critical
  category text NOT NULL,   -- api_route, external_api, database, etc.
  source text NOT NULL,     -- e.g., "POST /api/alerts", "StreetEasyAPI"
  message text NOT NULL,    -- Human-readable description

  -- User Context
  user_id text,            -- Clerk user ID
  session_id text,         -- Session identifier

  -- Request Context (API routes)
  method text,             -- HTTP method
  path text,               -- API route path
  status_code integer,     -- HTTP status code
  ip_address text,         -- Anonymized client IP
  user_agent text,         -- Client user agent

  -- Error Details
  error_type text,         -- Error class name
  error_message text,      -- Original error message
  stack_trace text,        -- Full stack trace

  -- Contextual Data
  metadata jsonb,          -- Flexible JSON storage

  -- Related Records (for correlation)
  alert_id uuid,
  listing_id uuid,
  notification_id uuid,
  batch_id uuid,
  cron_job_log_id uuid,

  -- Timing & Resolution
  timestamp timestamp NOT NULL,
  duration integer,        -- Operation duration (ms)
  resolved boolean,        -- Error resolution tracking
  resolved_at timestamp,
  resolved_by text,

  -- Data Retention
  expires_at timestamp     -- Automatic cleanup
);
```

### Indexes

**Performance Indexes:**
- `timestamp_idx`: Time-based queries
- `level_idx`: Filter by severity
- `category_idx`: Filter by event type
- `user_id_idx`: User-specific errors

**Composite Indexes:**
- `error_query_idx (level, category, timestamp)`: Common error queries
- `user_errors_idx (user_id, level, timestamp)`: User error tracking
- `source_idx`: Filter by source

**Retention Index:**
- `expires_at_idx`: Efficient cleanup queries

---

## Service Layer

### Core Functions

#### Basic Logging

```typescript
import { logError, logWarn, logInfo } from '@/lib/services/audit-logger.service';

// Error logging
await logError(
  'api_route',
  'POST /api/alerts',
  'Failed to create alert',
  {
    error,
    userId: 'user_123',
    request,
    metadata: { alertData }
  }
);

// Warning logging
await logWarn(
  'validation',
  'POST /api/alerts',
  'Invalid price range',
  { userId, metadata: { priceRange } }
);

// Info logging
await logInfo(
  'system',
  'startup',
  'Application started successfully',
  { metadata: { version: '1.0.0' } }
);
```

#### Specialized Functions

```typescript
// API errors
await logAPIError(
  'POST /api/alerts',
  'Request failed',
  error,
  request,
  { userId, metadata: { alertId } }
);

// External API failures
await logExternalAPIError(
  'StreetEasy',
  'fetchListings',
  error,
  { metadata: { criteria } }
);

// Database errors
await logDatabaseError(
  'createAlert',
  error,
  { metadata: { table: 'alerts', operation: 'INSERT' } }
);

// Webhook errors
await logWebhookError(
  'clerk',
  'user.created',
  error,
  request,
  { metadata: { userId } }
);

// Notification failures
await logNotificationError(
  'sms',
  error,
  notificationId,
  { metadata: { to: 'user_phone' } }
);
```

---

## Integration Patterns

### 1. Middleware Approach (Recommended)

**Automatic error logging for API routes:**

```typescript
import { withAudit } from '@/lib/middleware/audit-middleware';

export const GET = withAudit(
  async (request: NextRequest) => {
    // Your route logic
    const data = await fetchData();
    return NextResponse.json({ data });
  },
  {
    source: 'GET /api/alerts',
    logSuccess: false,  // Optional: log successful requests
  }
);
```

**With authentication:**

```typescript
import { withAuthAudit } from '@/lib/middleware/audit-middleware';

export const POST = withAuthAudit(
  async (request: NextRequest) => {
    const { userId } = await auth();
    // Your authenticated route logic
  },
  {
    source: 'POST /api/alerts',
  }
);
```

**For webhooks:**

```typescript
import { withWebhookAudit } from '@/lib/middleware/audit-middleware';

export const POST = withWebhookAudit(
  async (request: NextRequest) => {
    // Webhook processing logic
  },
  {
    source: 'POST /api/webhooks/clerk',
    webhookType: 'clerk',
  }
);
```

### 2. Manual Try-Catch Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Business logic
    const result = await processRequest(body);

    return NextResponse.json({ success: true, result });

  } catch (error) {
    // Manual error logging
    await logAPIError(
      'POST /api/endpoint',
      'Request processing failed',
      error,
      request,
      { userId, metadata: { requestBody: body } }
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Service Layer Integration

```typescript
export async function fetchStreetEasyListings(criteria: any) {
  try {
    const response = await fetch('https://api.streeteasy.com/...', {
      headers: { 'X-RapidAPI-Key': process.env.STREETEASY_API_KEY! },
    });

    if (!response.ok) {
      throw new Error(`StreetEasy API error: ${response.status}`);
    }

    return response.json();

  } catch (error) {
    await logExternalAPIError(
      'StreetEasy',
      'fetchListings',
      error,
      { metadata: { criteria, endpoint: 'https://api.streeteasy.com/...' } }
    );
    throw error; // Re-throw to handle at higher level
  }
}
```

### 4. Cron Job Integration

```typescript
export async function checkAllAlerts() {
  const startTime = Date.now();
  const cronJobLog = await createCronJobLog('check-alerts', 'started');

  try {
    // Process alerts
    const result = await processAlerts();

    // Complete cron job log
    await completeCronJobLog(cronJobLog.id, 'completed', {
      duration: Date.now() - startTime,
      alertsProcessed: result.alertsProcessed,
    });

    return result;

  } catch (error) {
    // Log cron error with correlation
    await logCronJobError(
      'check-alerts',
      error,
      cronJobLog.id,
      { duration: Date.now() - startTime }
    );

    // Update cron job log
    await completeCronJobLog(cronJobLog.id, 'failed', {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
```

---

## Query & Analysis

### Common Queries

```typescript
import {
  queryAuditLogs,
  getRecentErrors,
  getCriticalErrors,
  getUserErrors,
  getErrorsBySource,
  getSystemHealthMetrics,
} from '@/lib/services/audit-query.service';

// Recent errors (last 24h)
const recentErrors = await getRecentErrors(50);

// Unresolved critical errors
const critical = await getCriticalErrors();

// User-specific errors
const userErrors = await getUserErrors('user_123', 24);

// Errors by source
const apiErrors = await getErrorsBySource('POST /api/alerts', 24);

// System health overview
const health = await getSystemHealthMetrics();
console.log({
  errors24h: health.totalErrors24h,
  critical24h: health.totalCritical24h,
  errorRate: health.errorRate,
  topErrors: health.topErrors,
});
```

### Advanced Queries

```typescript
// Custom filters
const logs = await queryAuditLogs({
  level: 'error',
  category: 'external_api',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 1000,
});

// Search by message
const searchResults = await searchAuditLogs('StreetEasy timeout', {
  level: 'error',
  startDate: yesterday,
});

// Performance metrics
const perf = await getPerformanceMetrics(24);
console.log({
  avgDuration: perf.avgDuration,
  p95Duration: perf.p95Duration,
  slowestEndpoints: perf.slowestEndpoints,
});

// Related errors (correlation)
const related = await getRelatedErrors('log_id_123');
```

### Debugging Workflow

1. **Identify pattern**: Use `getSystemHealthMetrics()` for overview
2. **Drill down**: Use `getErrorsBySource()` or `getErrorsByCategory()`
3. **Correlate**: Use `getRelatedErrors()` to find related issues
4. **Resolve**: Mark errors as resolved with `resolveAuditLog()`

---

## Data Retention

### Retention Periods

| Log Level | Retention Period | Use Case |
|-----------|------------------|----------|
| debug     | 7 days          | Development debugging |
| info      | 30 days         | System events |
| warn      | 90 days         | Non-critical issues |
| error     | 180 days        | Error tracking |
| critical  | 365 days        | Critical incidents |

### Automatic Cleanup

```typescript
import { cleanupExpiredLogs } from '@/lib/services/audit-logger.service';

// Run periodically (e.g., daily cron job)
const deletedCount = await cleanupExpiredLogs();
console.log(`Deleted ${deletedCount} expired audit logs`);
```

**Recommended Setup:**
- Create a daily cron job at `/api/cron/cleanup-audit-logs`
- Schedule: `0 2 * * *` (2 AM daily)

---

## Performance Optimization

### Best Practices

1. **Fire-and-forget**: Audit logging doesn't wait for DB confirmation
2. **Indexed queries**: All common query patterns have dedicated indexes
3. **Data sanitization**: Remove sensitive data before logging
4. **Metadata limits**: Keep metadata under 10KB for performance

### Privacy Safeguards

**Automatic anonymization:**
- IP addresses: `192.168.1.100` → `192.168.1.0`
- Phone numbers: Last 4 digits masked
- Sensitive fields: Automatically redacted (`password`, `token`, `apiKey`, etc.)

```typescript
// Before logging
const metadata = {
  password: 'secret123',  // Automatically becomes '[REDACTED]'
  apiKey: 'key_abc',      // Automatically becomes '[REDACTED]'
  email: 'user@example.com', // Not sensitive, logged as-is
};
```

### Monitoring Overhead

- **Average log write time**: <10ms
- **Storage per log**: ~1-2KB (varies by metadata)
- **Index overhead**: ~20% of table size

---

## Monitoring & Alerts

### Health Check Dashboard

```typescript
export async function GET() {
  const health = await getSystemHealthMetrics();

  return NextResponse.json({
    status: health.unresolvedCritical > 0 ? 'unhealthy' : 'healthy',
    metrics: {
      errors24h: health.totalErrors24h,
      errorRate: health.errorRate,
      unresolvedCritical: health.unresolvedCritical,
    },
    topErrors: health.topErrors.slice(0, 5),
  });
}
```

### Alert Thresholds

**Recommended alerts:**

1. **Critical errors**: Alert immediately when `unresolvedCritical > 0`
2. **Error spike**: Alert when `errorRate > 10/hour`
3. **API failures**: Alert when external API errors > 5 in 15 minutes
4. **Database issues**: Alert on any database category errors

### Integration with Monitoring Services

**Vercel Log Drains:**
```bash
# Forward critical logs to external service
vercel log-drain add <service-url>
```

**Custom webhook for critical errors:**
```typescript
async function notifyOnCritical(log: AuditLog) {
  if (log.level === 'critical') {
    await fetch('https://your-alert-service.com/webhook', {
      method: 'POST',
      body: JSON.stringify({
        message: log.message,
        source: log.source,
        timestamp: log.timestamp,
      }),
    });
  }
}
```

---

## Migration & Setup

### 1. Run Migration

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push
```

### 2. Verify Schema

```sql
-- Check table exists
SELECT * FROM audit_logs LIMIT 1;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'audit_logs';
```

### 3. Test Logging

```typescript
import { logInfo } from '@/lib/services/audit-logger.service';

await logInfo(
  'system',
  'test',
  'Audit logging system initialized',
  { metadata: { test: true } }
);
```

### 4. Update Existing Routes

Gradually migrate API routes to use audit middleware:

```typescript
// Before
export async function GET(request: NextRequest) {
  try {
    // Logic
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// After
import { withAudit } from '@/lib/middleware/audit-middleware';

export const GET = withAudit(
  async (request: NextRequest) => {
    // Same logic, automatic error logging
  },
  { source: 'GET /api/route' }
);
```

---

## Troubleshooting

### Common Issues

**Issue**: Logs not appearing
- **Check**: Database connection working?
- **Check**: Migration applied successfully?
- **Check**: Console for "AUDIT LOG FAILURE" messages

**Issue**: Performance degradation
- **Check**: Index health: `SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';`
- **Check**: Table size: `SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));`
- **Solution**: Run `cleanupExpiredLogs()` if table is large

**Issue**: Privacy concerns
- **Check**: IP anonymization working?
- **Check**: Metadata sanitization active?
- **Review**: Don't set `captureRequestBody: true` in production

---

## Example Dashboard Query

```sql
-- Daily error summary
SELECT
  DATE(timestamp) as date,
  level,
  category,
  COUNT(*) as count
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), level, category
ORDER BY date DESC, count DESC;

-- Top error sources
SELECT
  source,
  COUNT(*) as error_count,
  MAX(timestamp) as last_occurrence
FROM audit_logs
WHERE level = 'error'
  AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY source
ORDER BY error_count DESC
LIMIT 10;
```

---

## Next Steps

1. **Deploy migration** to production database
2. **Update API routes** to use audit middleware
3. **Set up monitoring** dashboard for system health
4. **Configure alerts** for critical errors
5. **Schedule cleanup** cron job for expired logs

