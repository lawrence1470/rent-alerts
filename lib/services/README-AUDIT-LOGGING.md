# Audit Logging System

> Comprehensive error tracking and system event logging for production reliability

## Quick Start

### 1. Import Functions

```typescript
import { withAudit } from '@/lib/middleware/audit-middleware';
import { logError, logAPIError } from '@/lib/services/audit-logger.service';
```

### 2. Use Middleware (Recommended)

```typescript
export const GET = withAudit(
  async (request) => {
    // Your logic
    return NextResponse.json({ data });
  },
  { source: 'GET /api/route' }
);
```

### 3. Query Logs

```typescript
import { getRecentErrors } from '@/lib/services/audit-query.service';

const errors = await getRecentErrors(50);
```

---

## Files in This Directory

### Core Services

- **`audit-logger.service.ts`** - Main logging functions
  - Basic logging: `logDebug`, `logInfo`, `logWarn`, `logError`, `logCritical`
  - Specialized: `logAPIError`, `logExternalAPIError`, `logDatabaseError`, etc.
  - Privacy: IP anonymization, sensitive data redaction
  - Retention: Automatic cleanup based on log level

- **`audit-query.service.ts`** - Query and analysis utilities
  - `queryAuditLogs()` - Flexible log queries
  - `getRecentErrors()` - Last 24 hours errors
  - `getCriticalErrors()` - Unresolved critical issues
  - `getSystemHealthMetrics()` - Overall system health
  - `getPerformanceMetrics()` - API performance analysis
  - `exportAuditLogsCSV()` - Export for analysis

### Middleware

- **`../middleware/audit-middleware.ts`** - Automatic logging wrappers
  - `withAudit()` - General API routes
  - `withAuthAudit()` - Authenticated routes
  - `withWebhookAudit()` - Webhook endpoints
  - `createErrorResponse()` - Standardized error responses

---

## Common Patterns

### Pattern 1: API Route with Automatic Logging

```typescript
import { withAuthAudit } from '@/lib/middleware/audit-middleware';

export const POST = withAuthAudit(
  async (request) => {
    const { userId } = await auth();
    // Your business logic
    return NextResponse.json({ success: true });
  },
  { source: 'POST /api/alerts' }
);
```

**Benefits:**
- ✅ Automatic error logging with full context
- ✅ Auth failure tracking
- ✅ Performance metrics
- ✅ Stack traces
- ✅ Non-blocking

### Pattern 2: External API Integration

```typescript
import { logExternalAPIError } from '@/lib/services/audit-logger.service';

export async function fetchStreetEasyListings(criteria: any) {
  try {
    const response = await fetch(apiUrl, {
      headers: { 'X-RapidAPI-Key': process.env.STREETEASY_API_KEY! },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();

  } catch (error) {
    await logExternalAPIError(
      'StreetEasy',
      'fetchListings',
      error,
      { metadata: { criteria } }
    );
    throw error; // Re-throw for higher-level handling
  }
}
```

**Benefits:**
- ✅ Service-specific error tracking
- ✅ Operation context
- ✅ Request parameters logged
- ✅ Correlation with other errors

### Pattern 3: Database Operations

```typescript
import { logDatabaseError } from '@/lib/services/audit-logger.service';

export async function createAlert(data: any) {
  try {
    return await db.insert(alerts).values(data).returning();
  } catch (error) {
    await logDatabaseError(
      'createAlert',
      error,
      {
        metadata: {
          table: 'alerts',
          operation: 'INSERT',
          data: { name: data.name, areas: data.areas },
        },
      }
    );
    throw error;
  }
}
```

**Benefits:**
- ✅ Database-specific error category
- ✅ Table and operation tracking
- ✅ Data context (sanitized)

### Pattern 4: Cron Job Integration

```typescript
import { logCronJobError } from '@/lib/services/audit-logger.service';

export async function checkAllAlerts() {
  const cronLog = await createCronJobLog('check-alerts', 'started');

  try {
    const result = await processAlerts();
    await completeCronJobLog(cronLog.id, 'completed', { duration });
    return result;
  } catch (error) {
    await logCronJobError('check-alerts', error, cronLog.id);
    await completeCronJobLog(cronLog.id, 'failed', { error, duration });
    throw error;
  }
}
```

**Benefits:**
- ✅ Correlation with cron_job_logs
- ✅ Execution timeline tracking
- ✅ Failure analysis

---

## Query Examples

### Get Recent Errors

```typescript
import { getRecentErrors } from '@/lib/services/audit-query.service';

const errors = await getRecentErrors(50); // Last 24 hours, limit 50
```

### Check System Health

```typescript
import { getSystemHealthMetrics } from '@/lib/services/audit-query.service';

const health = await getSystemHealthMetrics();

console.log({
  errors24h: health.totalErrors24h,
  errorRate: health.errorRate, // errors per hour
  unresolvedCritical: health.unresolvedCritical,
  topErrors: health.topErrors, // Most frequent errors
});
```

### User-Specific Errors

```typescript
import { getUserErrors } from '@/lib/services/audit-query.service';

const userErrors = await getUserErrors('user_123', 24); // Last 24 hours
```

### Custom Query

```typescript
import { queryAuditLogs } from '@/lib/services/audit-query.service';

const logs = await queryAuditLogs({
  level: 'error',
  category: 'external_api',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 1000,
});
```

### Search by Message

```typescript
import { searchAuditLogs } from '@/lib/services/audit-query.service';

const results = await searchAuditLogs('timeout', {
  level: 'error',
  category: 'external_api',
});
```

### Export for Analysis

```typescript
import { exportAuditLogsCSV } from '@/lib/services/audit-query.service';

const csv = await exportAuditLogsCSV({
  level: 'error',
  startDate: lastWeek,
  endDate: today,
});

// Save to file or send to user
```

---

## Log Levels & Categories

### Severity Levels

| Level    | Use Case                | Retention |
|----------|------------------------|-----------|
| debug    | Development debugging   | 7 days    |
| info     | System events          | 30 days   |
| warn     | Non-critical issues    | 90 days   |
| error    | Error tracking         | 180 days  |
| critical | Critical incidents     | 365 days  |

### Event Categories

| Category        | Use Case                          | Example                        |
|----------------|-----------------------------------|--------------------------------|
| api_route      | API endpoint errors               | POST /api/alerts failed        |
| external_api   | Third-party API failures          | StreetEasy timeout             |
| database       | Database operation errors         | INSERT failed - unique constraint |
| webhook        | Webhook processing issues         | Clerk webhook signature invalid |
| cron_job       | Cron execution errors             | check-alerts job failed        |
| notification   | Email/SMS delivery failures       | Twilio SMS send failed         |
| authentication | Auth failures                     | Invalid token                  |
| validation     | Input validation errors           | Price range invalid            |
| system         | General system events             | Server restart, deployment     |

---

## Privacy & Security

### Automatic Protections

1. **IP Anonymization**
   - IPv4: `192.168.1.100` → `192.168.1.0`
   - IPv6: Keeps first 4 groups, zeros rest

2. **Sensitive Data Redaction**
   - Automatically removes: `password`, `token`, `secret`, `apiKey`, etc.
   - Replaces with: `[REDACTED]`

3. **User Agent Truncation**
   - Limited to 200 characters

### Manual Anonymization

```typescript
metadata: {
  phoneNumber: phoneNumber.replace(/\d{4}$/, 'XXXX'),
  email: email.split('@')[0].slice(0, 3) + '***@' + email.split('@')[1],
}
```

---

## Performance

### Benchmarks

- **Log write time**: <10ms (fire-and-forget)
- **Query time**: <50ms (indexed)
- **Storage per log**: ~1-2KB
- **Index overhead**: ~20% of table size

### Best Practices

1. **Don't log every success**: Set `logSuccess: false`
2. **Limit metadata**: Keep under 10KB
3. **Use appropriate level**: Don't use `error` for validation failures
4. **Run cleanup**: Daily cron to prevent bloat

---

## Monitoring

### Health Check

```typescript
const health = await getSystemHealthMetrics();

// Alert on critical errors
if (health.unresolvedCritical > 0) {
  await sendAlert('Critical errors detected');
}

// Alert on error spike
if (health.errorRate > 10) {
  await sendAlert('Error rate spike detected');
}
```

### Admin API

```bash
# System health
curl /api/admin/audit-logs?mode=health

# Recent errors
curl /api/admin/audit-logs?mode=recent-errors&limit=50

# Critical errors
curl /api/admin/audit-logs?mode=critical

# Performance metrics
curl /api/admin/audit-logs?mode=performance&hours=24

# Export CSV
curl /api/admin/audit-logs?mode=export&level=error > errors.csv
```

---

## Data Retention

### Automatic Cleanup

- **Schedule**: Daily at 2 AM
- **Endpoint**: `/api/cron/cleanup-audit-logs`
- **Process**: Deletes logs where `expires_at < NOW()`

### Manual Cleanup

```typescript
import { cleanupExpiredLogs } from '@/lib/services/audit-logger.service';

const deleted = await cleanupExpiredLogs();
console.log(`Deleted ${deleted} expired logs`);
```

---

## Troubleshooting

### Logs Not Appearing

1. Check database migration applied
2. Verify `DATABASE_URL` configured
3. Look for console errors: `[AUDIT LOG FAILURE]`

### Performance Issues

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));

-- Check index health
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'audit_logs';
```

**Solution**: Run cleanup if table is large

### Privacy Concerns

- Never set `captureRequestBody: true` in production
- Never set `captureResponseBody: true` in production
- Review metadata before logging sensitive operations

---

## Documentation

### Full Guides

1. **Implementation Guide**: `/claudedocs/audit-logging-guide.md`
   - Complete architecture
   - Integration patterns
   - Performance optimization
   - Monitoring setup

2. **Quick Reference**: `/claudedocs/audit-logging-quick-reference.md`
   - Common code snippets
   - API endpoints
   - Troubleshooting

3. **Implementation Summary**: `/claudedocs/audit-logging-implementation-summary.md`
   - Overview of all files
   - Migration checklist
   - Production readiness

### Code Examples

- **Integration Examples**: `../examples/audit-integration-examples.ts`
- **Live Example**: `../examples/audit-integration-live-example.ts`

---

## Support

For questions:
1. Check documentation in `/claudedocs/`
2. Review code examples in `../examples/`
3. Query existing audit logs for patterns
4. Use admin API for system analysis

