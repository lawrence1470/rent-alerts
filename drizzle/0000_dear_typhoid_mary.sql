CREATE TABLE "alert_batch_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"areas" text NOT NULL,
	"min_price" integer,
	"max_price" integer,
	"min_beds" integer,
	"max_beds" integer,
	"min_baths" integer,
	"no_fee" boolean,
	"alert_count" integer DEFAULT 0 NOT NULL,
	"criteria_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_fetched" timestamp,
	CONSTRAINT "alert_batches_criteria_hash_unique" UNIQUE("criteria_hash")
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"areas" text NOT NULL,
	"min_price" integer,
	"max_price" integer,
	"min_beds" integer,
	"max_beds" integer,
	"min_baths" integer,
	"no_fee" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_checked" timestamp
);
--> statement-breakpoint
CREATE TABLE "cron_job_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"alerts_processed" integer DEFAULT 0,
	"batches_fetched" integer DEFAULT 0,
	"new_listings_found" integer DEFAULT 0,
	"notifications_created" integer DEFAULT 0,
	"error_message" text,
	"error_stack" text
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"street_easy_id" text NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"price" integer NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"sqft" integer,
	"no_fee" boolean DEFAULT false,
	"listing_url" text NOT NULL,
	"image_url" text,
	"raw_data" jsonb,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "listings_street_easy_id_unique" UNIQUE("street_easy_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alert_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subject" text,
	"body" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_seen_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"alert_id" uuid NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_batch_memberships" ADD CONSTRAINT "alert_batch_memberships_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_batch_memberships" ADD CONSTRAINT "alert_batch_memberships_batch_id_alert_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."alert_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seen_listings" ADD CONSTRAINT "user_seen_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_seen_listings" ADD CONSTRAINT "user_seen_listings_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_batch_memberships_alert_id_idx" ON "alert_batch_memberships" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "alert_batch_memberships_batch_id_idx" ON "alert_batch_memberships" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_batch_memberships_unique" ON "alert_batch_memberships" USING btree ("alert_id","batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_batches_criteria_hash_idx" ON "alert_batches" USING btree ("criteria_hash");--> statement-breakpoint
CREATE INDEX "alert_batches_last_fetched_idx" ON "alert_batches" USING btree ("last_fetched");--> statement-breakpoint
CREATE INDEX "alerts_user_id_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alerts_is_active_idx" ON "alerts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alerts_last_checked_idx" ON "alerts" USING btree ("last_checked");--> statement-breakpoint
CREATE INDEX "alerts_batching_idx" ON "alerts" USING btree ("is_active","areas","min_price","max_price","min_beds","max_beds");--> statement-breakpoint
CREATE INDEX "cron_job_logs_job_name_idx" ON "cron_job_logs" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX "cron_job_logs_started_at_idx" ON "cron_job_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "cron_job_logs_status_idx" ON "cron_job_logs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_street_easy_id_idx" ON "listings" USING btree ("street_easy_id");--> statement-breakpoint
CREATE INDEX "listings_neighborhood_idx" ON "listings" USING btree ("neighborhood");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "listings_first_seen_at_idx" ON "listings" USING btree ("first_seen_at");--> statement-breakpoint
CREATE INDEX "listings_is_active_idx" ON "listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_alert_id_idx" ON "notifications" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_channel_idx" ON "notifications" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_pending_idx" ON "notifications" USING btree ("status","channel","created_at");--> statement-breakpoint
CREATE INDEX "user_seen_listings_user_id_idx" ON "user_seen_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_seen_listings_listing_id_idx" ON "user_seen_listings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "user_seen_listings_alert_id_idx" ON "user_seen_listings" USING btree ("alert_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_seen_listings_unique" ON "user_seen_listings" USING btree ("user_id","listing_id","alert_id");