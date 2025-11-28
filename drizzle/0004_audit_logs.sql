-- ============================================================================
-- AUDIT LOGS TABLE MIGRATION
-- ============================================================================
-- Comprehensive error and event tracking for system reliability and debugging
--
-- Design Considerations:
-- - Performance: Indexed for fast queries by time, level, category, user
-- - Retention: Automatic cleanup via expiresAt timestamp
-- - Correlation: Foreign keys to related entities (alerts, listings, etc.)
-- - Privacy: IP addresses should be anonymized in application layer
-- - Flexibility: JSONB metadata for context-specific data

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

	-- Event Classification
	"level" text DEFAULT 'info' NOT NULL CHECK ("level" IN ('debug', 'info', 'warn', 'error', 'critical')),
	"category" text NOT NULL CHECK ("category" IN (
		'api_route',
		'external_api',
		'database',
		'webhook',
		'cron_job',
		'notification',
		'authentication',
		'validation',
		'system'
	)),

	-- Event Context
	"source" text NOT NULL,
	"message" text NOT NULL,

	-- User Context (optional)
	"user_id" text,
	"session_id" text,

	-- Request Context (for API routes)
	"method" text,
	"path" text,
	"status_code" integer,
	"ip_address" text,
	"user_agent" text,

	-- Error Details
	"error_type" text,
	"error_message" text,
	"stack_trace" text,

	-- Contextual Data
	"metadata" jsonb,

	-- Related Records (for correlation)
	"alert_id" uuid,
	"listing_id" uuid,
	"notification_id" uuid,
	"batch_id" uuid,
	"cron_job_log_id" uuid,

	-- Timing & Resolution
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"duration" integer,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" text,

	-- Data Retention
	"expires_at" timestamp,

	-- Foreign Key Constraints
	CONSTRAINT "audit_logs_alert_id_fkey"
		FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL,
	CONSTRAINT "audit_logs_listing_id_fkey"
		FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL,
	CONSTRAINT "audit_logs_notification_id_fkey"
		FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL,
	CONSTRAINT "audit_logs_batch_id_fkey"
		FOREIGN KEY ("batch_id") REFERENCES "alert_batches"("id") ON DELETE SET NULL,
	CONSTRAINT "audit_logs_cron_job_log_id_fkey"
		FOREIGN KEY ("cron_job_log_id") REFERENCES "cron_job_logs"("id") ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs" ("timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_level_idx" ON "audit_logs" ("level");
CREATE INDEX IF NOT EXISTS "audit_logs_category_idx" ON "audit_logs" ("category");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "audit_logs_error_query_idx"
	ON "audit_logs" ("level", "category", "timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_user_errors_idx"
	ON "audit_logs" ("user_id", "level", "timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_source_idx" ON "audit_logs" ("source");
CREATE INDEX IF NOT EXISTS "audit_logs_status_code_idx" ON "audit_logs" ("status_code");

-- Retention cleanup index
CREATE INDEX IF NOT EXISTS "audit_logs_expires_at_idx" ON "audit_logs" ("expires_at");

-- Related records indexes
CREATE INDEX IF NOT EXISTS "audit_logs_alert_id_idx" ON "audit_logs" ("alert_id");
CREATE INDEX IF NOT EXISTS "audit_logs_cron_job_log_id_idx" ON "audit_logs" ("cron_job_log_id");

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE "audit_logs" IS 'Comprehensive error and event tracking for system reliability and debugging';
COMMENT ON COLUMN "audit_logs"."level" IS 'Log severity: debug, info, warn, error, critical';
COMMENT ON COLUMN "audit_logs"."category" IS 'Event category for filtering and analysis';
COMMENT ON COLUMN "audit_logs"."source" IS 'Source of the event (e.g., API route, service name, function name)';
COMMENT ON COLUMN "audit_logs"."metadata" IS 'Flexible JSON storage for context-specific data (request body, response, params, etc.)';
COMMENT ON COLUMN "audit_logs"."expires_at" IS 'Timestamp when this log should be deleted (for automatic retention cleanup)';
