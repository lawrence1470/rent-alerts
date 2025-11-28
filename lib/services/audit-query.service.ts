/**
 * Audit Query Service
 *
 * Utilities for querying and analyzing audit logs
 * Used for debugging, monitoring, and system health checks
 */

import { db } from '../db';
import { auditLogs, type AuditLog } from '../schema';
import { eq, and, desc, gte, lte, sql, or } from 'drizzle-orm';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuditQueryFilters {
  level?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category?: 'database' | 'api_route' | 'external_api' | 'webhook' | 'cron_job' | 'notification' | 'authentication' | 'validation' | 'system';
  source?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  resolved?: boolean;
  statusCode?: number;
  limit?: number;
}

export interface ErrorSummary {
  errorType: string;
  count: number;
  lastOccurrence: Date;
  sources: string[];
  sample: AuditLog;
}

export interface SystemHealthMetrics {
  totalErrors24h: number;
  totalCritical24h: number;
  totalWarnings24h: number;
  unresolvedCritical: number;
  errorRate: number; // errors per hour
  topErrors: ErrorSummary[];
  errorsByCategory: Record<string, number>;
  errorsBySource: Record<string, number>;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Query audit logs with flexible filters
 */
export async function queryAuditLogs(
  filters: AuditQueryFilters = {}
): Promise<AuditLog[]> {
  const conditions = [];

  if (filters.level) {
    conditions.push(eq(auditLogs.level, filters.level));
  }

  if (filters.category) {
    conditions.push(eq(auditLogs.category, filters.category));
  }

  if (filters.source) {
    conditions.push(eq(auditLogs.source, filters.source));
  }

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters.resolved !== undefined) {
    conditions.push(eq(auditLogs.resolved, filters.resolved));
  }

  if (filters.statusCode) {
    conditions.push(eq(auditLogs.statusCode, filters.statusCode));
  }

  if (filters.startDate) {
    conditions.push(gte(auditLogs.timestamp, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(auditLogs.timestamp, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.auditLogs.findMany({
    where: whereClause,
    orderBy: [desc(auditLogs.timestamp)],
    limit: filters.limit || 100,
  });
}

/**
 * Get recent errors (last 24 hours)
 */
export async function getRecentErrors(limit: number = 50): Promise<AuditLog[]> {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  return queryAuditLogs({
    level: 'error',
    startDate: yesterday,
    limit,
  });
}

/**
 * Get critical errors (unresolved)
 */
export async function getCriticalErrors(): Promise<AuditLog[]> {
  return queryAuditLogs({
    level: 'critical',
    resolved: false,
  });
}

/**
 * Get errors for specific user
 */
export async function getUserErrors(
  userId: string,
  hours: number = 24
): Promise<AuditLog[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return queryAuditLogs({
    userId,
    level: 'error',
    startDate,
  });
}

/**
 * Get errors by source (API route, service, etc.)
 */
export async function getErrorsBySource(
  source: string,
  hours: number = 24
): Promise<AuditLog[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return queryAuditLogs({
    source,
    level: 'error',
    startDate,
  });
}

/**
 * Get errors by category
 */
export async function getErrorsByCategory(
  category: 'database' | 'api_route' | 'external_api' | 'webhook' | 'cron_job' | 'notification' | 'authentication' | 'validation' | 'system',
  hours: number = 24
): Promise<AuditLog[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return queryAuditLogs({
    category,
    level: 'error',
    startDate,
  });
}

// ============================================================================
// AGGREGATION & ANALYSIS
// ============================================================================

/**
 * Get error summary grouped by error type
 */
export async function getErrorSummary(
  hours: number = 24
): Promise<ErrorSummary[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const errors = await queryAuditLogs({
    level: 'error',
    startDate,
    limit: 1000,
  });

  // Group by error type
  const grouped = new Map<string, AuditLog[]>();

  for (const error of errors) {
    const type = error.errorType || 'Unknown';
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(error);
  }

  // Create summaries
  const summaries: ErrorSummary[] = [];

  for (const [errorType, logs] of grouped.entries()) {
    const sources = [...new Set(logs.map(log => log.source))];
    const lastOccurrence = logs.reduce(
      (latest, log) => log.timestamp > latest ? log.timestamp : latest,
      logs[0].timestamp
    );

    summaries.push({
      errorType,
      count: logs.length,
      lastOccurrence,
      sources,
      sample: logs[0], // Most recent example
    });
  }

  // Sort by count (most frequent first)
  return summaries.sort((a, b) => b.count - a.count);
}

/**
 * Get comprehensive system health metrics
 */
export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  // Query all logs from last 24 hours
  const logs = await queryAuditLogs({
    startDate: yesterday,
    limit: 10000,
  });

  const errors = logs.filter(log => log.level === 'error');
  const critical = logs.filter(log => log.level === 'critical');
  const warnings = logs.filter(log => log.level === 'warn');
  const unresolvedCritical = critical.filter(log => !log.resolved);

  // Calculate error rate (errors per hour)
  const errorRate = errors.length / 24;

  // Group errors by category
  const errorsByCategory: Record<string, number> = {};
  for (const error of errors) {
    const cat = error.category;
    errorsByCategory[cat] = (errorsByCategory[cat] || 0) + 1;
  }

  // Group errors by source
  const errorsBySource: Record<string, number> = {};
  for (const error of errors) {
    const src = error.source;
    errorsBySource[src] = (errorsBySource[src] || 0) + 1;
  }

  // Get top errors
  const topErrors = await getErrorSummary(24);

  return {
    totalErrors24h: errors.length,
    totalCritical24h: critical.length,
    totalWarnings24h: warnings.length,
    unresolvedCritical: unresolvedCritical.length,
    errorRate: Math.round(errorRate * 10) / 10,
    topErrors: topErrors.slice(0, 10),
    errorsByCategory,
    errorsBySource,
  };
}

/**
 * Get performance metrics from audit logs
 */
export async function getPerformanceMetrics(hours: number = 24): Promise<{
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  slowestEndpoints: Array<{ source: string; avgDuration: number; count: number }>;
}> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const logs = await db.query.auditLogs.findMany({
    where: and(
      gte(auditLogs.timestamp, startDate),
      sql`${auditLogs.duration} IS NOT NULL`
    ),
    orderBy: [desc(auditLogs.timestamp)],
    limit: 10000,
  });

  if (logs.length === 0) {
    return {
      avgDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      slowestEndpoints: [],
    };
  }

  // Calculate average duration
  const durations = logs.map(log => log.duration!).filter(d => d > 0);
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  // Calculate percentiles
  const sorted = [...durations].sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  const p95Duration = sorted[p95Index] || 0;
  const p99Duration = sorted[p99Index] || 0;

  // Group by source and calculate average
  const bySource = new Map<string, number[]>();
  for (const log of logs) {
    if (!log.duration) continue;
    if (!bySource.has(log.source)) {
      bySource.set(log.source, []);
    }
    bySource.get(log.source)!.push(log.duration);
  }

  const slowestEndpoints = Array.from(bySource.entries())
    .map(([source, durations]) => ({
      source,
      avgDuration: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
      count: durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  return {
    avgDuration: Math.round(avgDuration),
    p95Duration,
    p99Duration,
    slowestEndpoints,
  };
}

// ============================================================================
// ERROR CORRELATION
// ============================================================================

/**
 * Find related errors (same user, similar time, same alert/listing)
 */
export async function getRelatedErrors(
  logId: string
): Promise<AuditLog[]> {
  const log = await db.query.auditLogs.findFirst({
    where: eq(auditLogs.id, logId),
  });

  if (!log) return [];

  // Find errors within 5 minutes, same user or related entity
  const fiveMinutesAgo = new Date(log.timestamp);
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const fiveMinutesAfter = new Date(log.timestamp);
  fiveMinutesAfter.setMinutes(fiveMinutesAfter.getMinutes() + 5);

  const conditions = [
    gte(auditLogs.timestamp, fiveMinutesAgo),
    lte(auditLogs.timestamp, fiveMinutesAfter),
  ];

  // Add user/entity filters
  const orConditions = [];
  if (log.userId) orConditions.push(eq(auditLogs.userId, log.userId));
  if (log.alertId) orConditions.push(eq(auditLogs.alertId, log.alertId));
  if (log.listingId) orConditions.push(eq(auditLogs.listingId, log.listingId));
  if (log.batchId) orConditions.push(eq(auditLogs.batchId, log.batchId));

  if (orConditions.length > 0) {
    conditions.push(or(...orConditions)!);
  }

  return db.query.auditLogs.findMany({
    where: and(...conditions),
    orderBy: [desc(auditLogs.timestamp)],
    limit: 50,
  });
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search audit logs by message or error message
 */
export async function searchAuditLogs(
  searchTerm: string,
  filters: AuditQueryFilters = {}
): Promise<AuditLog[]> {
  const baseConditions = [];

  if (filters.level) baseConditions.push(eq(auditLogs.level, filters.level));
  if (filters.category) baseConditions.push(eq(auditLogs.category, filters.category));
  if (filters.startDate) baseConditions.push(gte(auditLogs.timestamp, filters.startDate));

  // Search in message or error message
  const searchCondition = or(
    sql`${auditLogs.message} ILIKE ${`%${searchTerm}%`}`,
    sql`${auditLogs.errorMessage} ILIKE ${`%${searchTerm}%`}`
  );

  const whereClause = baseConditions.length > 0
    ? and(...baseConditions, searchCondition)
    : searchCondition;

  return db.query.auditLogs.findMany({
    where: whereClause,
    orderBy: [desc(auditLogs.timestamp)],
    limit: filters.limit || 100,
  });
}

// ============================================================================
// EXPORT FOR ANALYSIS
// ============================================================================

/**
 * Export audit logs as CSV for external analysis
 */
export async function exportAuditLogsCSV(
  filters: AuditQueryFilters = {}
): Promise<string> {
  const logs = await queryAuditLogs({
    ...filters,
    limit: 10000, // Max export size
  });

  // CSV headers
  const headers = [
    'timestamp',
    'level',
    'category',
    'source',
    'message',
    'userId',
    'method',
    'path',
    'statusCode',
    'errorType',
    'errorMessage',
    'duration',
    'resolved',
  ];

  // Build CSV
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.level,
    log.category,
    log.source,
    JSON.stringify(log.message),
    log.userId || '',
    log.method || '',
    log.path || '',
    log.statusCode || '',
    log.errorType || '',
    JSON.stringify(log.errorMessage || ''),
    log.duration || '',
    log.resolved ? 'yes' : 'no',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}
