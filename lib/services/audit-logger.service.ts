/**
 * Audit Logger Service
 *
 * Comprehensive logging service for tracking errors, events, and system operations
 *
 * Design Principles:
 * 1. Non-blocking: Never throw errors that would break primary operations
 * 2. Context-rich: Capture relevant metadata for debugging
 * 3. Performance-optimized: Minimal overhead on critical paths
 * 4. Privacy-aware: Anonymize sensitive data before logging
 */

import { db } from '../db';
import { auditLogs, type NewAuditLog } from '../schema';
import { NextRequest } from 'next/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogCategory =
  | 'api_route'
  | 'external_api'
  | 'database'
  | 'webhook'
  | 'cron_job'
  | 'notification'
  | 'authentication'
  | 'validation'
  | 'system';

export interface AuditLogContext {
  // User context
  userId?: string;
  sessionId?: string;

  // Request context
  request?: NextRequest | {
    method?: string;
    url?: string;
    headers?: Headers | Record<string, string>;
  };

  // Error details
  error?: Error | unknown;

  // Related entities
  alertId?: string;
  listingId?: string;
  notificationId?: string;
  batchId?: string;
  cronJobLogId?: string;

  // Performance
  duration?: number; // milliseconds

  // Additional context
  metadata?: Record<string, any>;
}

export interface LogOptions {
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  context?: AuditLogContext;
}

// ============================================================================
// DATA RETENTION CONFIGURATION
// ============================================================================

const RETENTION_PERIODS = {
  debug: 7, // days
  info: 30,
  warn: 90,
  error: 180,
  critical: 365,
} as const;

// ============================================================================
// PRIVACY HELPERS
// ============================================================================

/**
 * Anonymize IP address for privacy compliance (GDPR, CCPA)
 * Keeps network portion, removes host portion
 */
function anonymizeIP(ip: string): string {
  if (!ip) return '';

  // IPv4: Keep first 3 octets, zero last octet
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  // IPv6: Keep first 4 groups, zero rest
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}::`;
  }

  return '';
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'creditCard',
    'ssn',
    'pin',
  ];

  const sanitized = { ...metadata };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ============================================================================
// REQUEST CONTEXT EXTRACTION
// ============================================================================

/**
 * Extract relevant context from Next.js request
 */
function extractRequestContext(request?: NextRequest | any): {
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  if (!request) return {};

  try {
    const method = request.method;
    const path = request.url ? new URL(request.url).pathname : undefined;

    // Extract IP address
    let ipAddress: string | undefined;
    if (request.headers) {
      const headers = request.headers instanceof Headers
        ? request.headers
        : new Headers(request.headers);

      // Check common IP headers (Vercel, Cloudflare, etc.)
      ipAddress = headers.get('x-forwarded-for')?.split(',')[0].trim()
        || headers.get('x-real-ip')
        || headers.get('cf-connecting-ip');
    }

    // Extract user agent
    const userAgent = request.headers?.get?.('user-agent')
      || request.headers?.['user-agent'];

    return {
      method,
      path,
      ipAddress: ipAddress ? anonymizeIP(ipAddress) : undefined,
      userAgent: userAgent?.substring(0, 200), // Truncate long user agents
    };
  } catch (error) {
    console.error('Error extracting request context:', error);
    return {};
  }
}

/**
 * Extract error details from Error object
 */
function extractErrorDetails(error: unknown): {
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;
} {
  if (!error) return {};

  if (error instanceof Error) {
    return {
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
    };
  }

  return {
    errorType: 'Unknown',
    errorMessage: String(error),
  };
}

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Main audit logging function
 * Non-blocking - errors are logged but don't throw
 */
export async function createAuditLog(options: LogOptions): Promise<void> {
  try {
    const { level, category, source, message, context = {} } = options;

    // Extract request context
    const requestContext = extractRequestContext(context.request);

    // Extract error details
    const errorDetails = extractErrorDetails(context.error);

    // Calculate expiration based on retention period
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RETENTION_PERIODS[level]);

    // Sanitize metadata
    const sanitizedMetadata = context.metadata
      ? sanitizeMetadata(context.metadata)
      : undefined;

    // Build audit log entry
    const logEntry: NewAuditLog = {
      level,
      category,
      source,
      message,

      // User context
      userId: context.userId,
      sessionId: context.sessionId,

      // Request context
      method: requestContext.method,
      path: requestContext.path,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,

      // Error details
      errorType: errorDetails.errorType,
      errorMessage: errorDetails.errorMessage,
      stackTrace: errorDetails.stackTrace,

      // Related entities
      alertId: context.alertId,
      listingId: context.listingId,
      notificationId: context.notificationId,
      batchId: context.batchId,
      cronJobLogId: context.cronJobLogId,

      // Performance
      duration: context.duration,

      // Metadata
      metadata: sanitizedMetadata,

      // Retention
      expiresAt,
    };

    // Insert log entry (fire-and-forget for performance)
    await db.insert(auditLogs).values(logEntry);

  } catch (error) {
    // Fail silently - audit logging should never break primary operations
    // Use console.error as fallback
    console.error('[AUDIT LOG FAILURE]', {
      originalMessage: options.message,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS BY LOG LEVEL
// ============================================================================

export async function logDebug(
  category: LogCategory,
  source: string,
  message: string,
  context?: AuditLogContext
) {
  return createAuditLog({ level: 'debug', category, source, message, context });
}

export async function logInfo(
  category: LogCategory,
  source: string,
  message: string,
  context?: AuditLogContext
) {
  return createAuditLog({ level: 'info', category, source, message, context });
}

export async function logWarn(
  category: LogCategory,
  source: string,
  message: string,
  context?: AuditLogContext
) {
  return createAuditLog({ level: 'warn', category, source, message, context });
}

export async function logError(
  category: LogCategory,
  source: string,
  message: string,
  context?: AuditLogContext
) {
  return createAuditLog({ level: 'error', category, source, message, context });
}

export async function logCritical(
  category: LogCategory,
  source: string,
  message: string,
  context?: AuditLogContext
) {
  return createAuditLog({ level: 'critical', category, source, message, context });
}

// ============================================================================
// SPECIALIZED LOGGING FUNCTIONS
// ============================================================================

/**
 * Log API route errors with full request context
 */
export async function logAPIError(
  source: string,
  message: string,
  error: unknown,
  request: NextRequest,
  context?: Partial<AuditLogContext>
) {
  return logError('api_route', source, message, {
    error,
    request,
    ...context,
  });
}

/**
 * Log external API failures (StreetEasy, Resend, Twilio)
 */
export async function logExternalAPIError(
  apiName: string,
  operation: string,
  error: unknown,
  context?: Partial<AuditLogContext>
) {
  return logError('external_api', apiName, `${operation} failed`, {
    error,
    metadata: {
      operation,
      ...context?.metadata,
    },
    ...context,
  });
}

/**
 * Log database operation failures
 */
export async function logDatabaseError(
  operation: string,
  error: unknown,
  context?: Partial<AuditLogContext>
) {
  return logError('database', operation, 'Database operation failed', {
    error,
    ...context,
  });
}

/**
 * Log webhook processing errors
 */
export async function logWebhookError(
  webhookType: 'clerk' | 'stripe',
  eventType: string,
  error: unknown,
  request: NextRequest,
  context?: Partial<AuditLogContext>
) {
  return logError('webhook', `${webhookType}-webhook`, `Failed to process ${eventType} event`, {
    error,
    request,
    metadata: {
      eventType,
      ...context?.metadata,
    },
    ...context,
  });
}

/**
 * Log cron job errors with correlation to cron_job_logs
 */
export async function logCronJobError(
  jobName: string,
  error: unknown,
  cronJobLogId?: string,
  context?: Partial<AuditLogContext>
) {
  return logError('cron_job', jobName, 'Cron job execution failed', {
    error,
    cronJobLogId,
    ...context,
  });
}

/**
 * Log notification delivery failures
 */
export async function logNotificationError(
  channel: 'email' | 'sms' | 'push' | 'in_app',
  error: unknown,
  notificationId?: string,
  context?: Partial<AuditLogContext>
) {
  return logError('notification', `${channel}-notification`, 'Notification delivery failed', {
    error,
    notificationId,
    metadata: {
      channel,
      ...context?.metadata,
    },
    ...context,
  });
}

/**
 * Log authentication failures
 */
export async function logAuthError(
  message: string,
  request: NextRequest,
  context?: Partial<AuditLogContext>
) {
  return logWarn('authentication', 'auth-check', message, {
    request,
    ...context,
  });
}

/**
 * Log validation errors
 */
export async function logValidationError(
  source: string,
  message: string,
  validationErrors: Record<string, any>,
  context?: Partial<AuditLogContext>
) {
  return logWarn('validation', source, message, {
    metadata: {
      validationErrors,
      ...context?.metadata,
    },
    ...context,
  });
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get recent audit logs for debugging
 */
export async function getRecentAuditLogs(limit: number = 100) {
  return db.query.auditLogs.findMany({
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
    limit,
  });
}

/**
 * Get error logs for a specific user
 */
export async function getUserErrorLogs(userId: string, limit: number = 50) {
  const { eq, desc, or } = await import('drizzle-orm');

  return db.query.auditLogs.findMany({
    where: (logs) => eq(logs.userId, userId),
    orderBy: (logs) => [desc(logs.timestamp)],
    limit,
  });
}

/**
 * Get unresolved critical errors
 */
export async function getUnresolvedCriticalErrors() {
  const { eq, and } = await import('drizzle-orm');

  return db.query.auditLogs.findMany({
    where: (logs) => and(
      eq(logs.level, 'critical'),
      eq(logs.resolved, false)
    ),
    orderBy: (logs, { desc }) => [desc(logs.timestamp)],
  });
}

/**
 * Mark error as resolved
 */
export async function resolveAuditLog(logId: string, resolvedBy: string) {
  const { eq } = await import('drizzle-orm');

  return db.update(auditLogs)
    .set({
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    })
    .where(eq(auditLogs.id, logId));
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Delete expired audit logs (should be run periodically)
 */
export async function cleanupExpiredLogs(): Promise<number> {
  const { lte } = await import('drizzle-orm');

  const result = await db.delete(auditLogs)
    .where(lte(auditLogs.expiresAt, new Date()));

  return result.rowCount || 0;
}
