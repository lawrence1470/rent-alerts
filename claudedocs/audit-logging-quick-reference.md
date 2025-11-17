# Audit Logging - Quick Reference Card

## 🚀 Quick Start

### Import Functions

```typescript
// Service layer
import {
  logError,
  logWarn,
  logInfo,
  logAPIError,
  logExternalAPIError,
  logDatabaseError,
  logWebhookError,
  logNotificationError,
} from '@/lib/services/audit-logger.service';

// Middleware
import {
  withAudit,
  withAuthAudit,
  withWebhookAudit,
  createErrorResponse,
} from '@/lib/middleware/audit-middleware';

// Queries
import {
  queryAuditLogs,
  getRecentErrors,
  getCriticalErrors,
  getSystemHealthMetrics,
} from '@/lib/services/audit-query.service';
```

---

## 📝 Common Patterns

### API Route with Middleware

```typescript
export const GET = withAudit(
  async (request) => {
    // Your logic
    return NextResponse.json({ data });
  },
  { source: 'GET /api/route' }
);
```

### API Route with Auth

```typescript
export const POST = withAuthAudit(
  async (request) => {
    const { userId } = await auth();
    // Your logic
  },
  { source: 'POST /api/route' }
);
```

### Manual Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  await logAPIError(
    'POST /api/route',
    'Operation failed',
    error,
    request,
    { userId, metadata: { context } }
  );
  return createErrorResponse(...);
}
```

### External API Failures

```typescript
try {
  const response = await fetch(apiUrl);
} catch (error) {
  await logExternalAPIError(
    'ServiceName',
    'operationName',
    error,
    { metadata: { params } }
  );
  throw error;
}
```

### Database Errors

```typescript
try {
  await db.insert(table).values(data);
} catch (error) {
  await logDatabaseError(
    'insertOperation',
    error,
    { metadata: { table: 'table_name', data } }
  );
  throw error;
}
```

### Cron Job Errors

```typescript
const cronLog = await createCronJobLog('job-name', 'started');

try {
  await runJob();
  await completeCronJobLog(cronLog.id, 'completed', { duration });
} catch (error) {
  await logCronJobError('job-name', error, cronLog.id);
  await completeCronJobLog(cronLog.id, 'failed', { error, duration });
}
```

---

## 🔍 Query Examples

### Recent Errors

```typescript
const errors = await getRecentErrors(50);
```

### Critical Errors

```typescript
const critical = await getCriticalErrors();
```

### User Errors

```typescript
const userErrors = await getUserErrors('user_id', 24); // last 24h
```

### System Health

```typescript
const health = await getSystemHealthMetrics();
// Returns: totalErrors24h, errorRate, topErrors, etc.
```

### Custom Query

```typescript
const logs = await queryAuditLogs({
  level: 'error',
  category: 'api_route',
  startDate: new Date('2024-01-01'),
  limit: 100,
});
```

### Search

```typescript
const results = await searchAuditLogs('timeout', {
  level: 'error',
  category: 'external_api',
});
```

---

## 📊 API Endpoints

### Admin Dashboard

```bash
# System health
GET /api/admin/audit-logs?mode=health

# Recent errors
GET /api/admin/audit-logs?mode=recent-errors&limit=50

# Critical errors
GET /api/admin/audit-logs?mode=critical

# User errors
GET /api/admin/audit-logs?mode=user-errors&userId=user_123

# Performance metrics
GET /api/admin/audit-logs?mode=performance&hours=24

# Search logs
GET /api/admin/audit-logs?mode=search&search=timeout

# Export CSV
GET /api/admin/audit-logs?mode=export&level=error&startDate=2024-01-01
```

---

## 🎯 Log Levels & Retention

| Level    | Use Case                    | Retention |
|----------|----------------------------|-----------|
| debug    | Development debugging       | 7 days    |
| info     | System events              | 30 days   |
| warn     | Non-critical issues        | 90 days   |
| error    | Error tracking             | 180 days  |
| critical | Critical incidents         | 365 days  |

---

## 📂 Log Categories

| Category        | Use Case                          |
|----------------|-----------------------------------|
| api_route      | API endpoint errors               |
| external_api   | StreetEasy, Resend, Twilio fails |
| database       | DB operation failures             |
| webhook        | Clerk/Stripe webhook errors       |
| cron_job       | Cron execution errors             |
| notification   | Email/SMS delivery issues         |
| authentication | Auth failures                     |
| validation     | Input validation errors           |
| system         | General system events             |

---

## 🔧 Metadata Best Practices

### DO Include

```typescript
metadata: {
  operation: 'createAlert',
  table: 'alerts',
  criteria: { minPrice: 2000, maxPrice: 3000 },
  responseCode: 500,
}
```

### DON'T Include

```typescript
metadata: {
  password: 'secret123',      // ❌ Auto-redacted but avoid
  creditCard: '1234-5678',    // ❌ Sensitive data
  apiKey: 'key_xyz',          // ❌ Auto-redacted but avoid
}
```

---

## 🛡️ Privacy Features

### Automatic Anonymization

- **IP addresses**: `192.168.1.100` → `192.168.1.0`
- **Sensitive keys**: `password`, `token`, `apiKey` → `[REDACTED]`

### Manual Anonymization

```typescript
metadata: {
  phoneNumber: phoneNumber.replace(/\d{4}$/, 'XXXX'),
  email: email.split('@')[0].slice(0, 3) + '***@' + email.split('@')[1],
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...

# Optional (for cron auth)
CRON_SECRET=your_secret_here
```

### Vercel Cron Setup

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-audit-logs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 🚨 Monitoring Thresholds

### Alert When:

- **Critical errors > 0**: Immediate alert
- **Error rate > 10/hour**: Warning alert
- **External API errors > 5 in 15min**: Service degradation alert
- **Database errors > 0**: Infrastructure alert

### Health Check

```typescript
const health = await getSystemHealthMetrics();

if (health.unresolvedCritical > 0) {
  // Send alert
}

if (health.errorRate > 10) {
  // Send warning
}
```

---

## 📈 Performance

- **Average log write**: <10ms
- **Query performance**: <50ms (with indexes)
- **Storage per log**: ~1-2KB
- **Index overhead**: ~20% of table size

---

## 🔄 Cleanup

### Manual Cleanup

```typescript
import { cleanupExpiredLogs } from '@/lib/services/audit-logger.service';

const deleted = await cleanupExpiredLogs();
console.log(`Deleted ${deleted} expired logs`);
```

### Automatic Cleanup

Set up daily cron job at `/api/cron/cleanup-audit-logs`

---

## 🐛 Troubleshooting

### Logs Not Appearing

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs;"

# Check for failures
grep "AUDIT LOG FAILURE" logs
```

### Performance Issues

```sql
-- Check index health
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'audit_logs';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));
```

### Privacy Concerns

```typescript
// Never capture request/response bodies in production
withAudit(handler, {
  source: 'route',
  captureRequestBody: false,  // ✅ Safe for production
  captureResponseBody: false, // ✅ Safe for production
});
```

---

## 📚 Full Documentation

See `/claudedocs/audit-logging-guide.md` for complete documentation.
