CREATE TABLE "alert_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"batch_id" uuid,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"execution_time_ms" integer,
	"total_listings_from_batch" integer DEFAULT 0 NOT NULL,
	"matching_listings" integer DEFAULT 0 NOT NULL,
	"new_listings" integer DEFAULT 0 NOT NULL,
	"duplicate_listings" integer DEFAULT 0 NOT NULL,
	"notifications_sent" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"skip_reason" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "notify_only_new_apartments" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "twilio_message_sid" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_address" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "resend_message_id" text;--> statement-breakpoint
ALTER TABLE "alert_runs" ADD CONSTRAINT "alert_runs_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_runs" ADD CONSTRAINT "alert_runs_batch_id_alert_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."alert_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_runs_alert_id_idx" ON "alert_runs" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "alert_runs_executed_at_idx" ON "alert_runs" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "alert_runs_status_idx" ON "alert_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alert_runs_alert_executed_idx" ON "alert_runs" USING btree ("alert_id","executed_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");