CREATE TABLE "building_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_normalized" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"dhcr_building_id" text,
	"dhcr_last_updated" timestamp,
	"is_rent_stabilized" boolean NOT NULL,
	"stabilized_unit_count" integer,
	"total_unit_count" integer,
	"heuristic_probability" real,
	"building_year_built" integer,
	"cache_hit_count" integer DEFAULT 0,
	"last_queried_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "filter_rent_stabilized" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "enable_phone_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "enable_email_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "rent_stabilized_status" text DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "rent_stabilized_probability" real;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "rent_stabilized_source" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "rent_stabilized_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "building_dhcr_id" text;--> statement-breakpoint
CREATE INDEX "building_cache_location_idx" ON "building_cache" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "building_cache_address_idx" ON "building_cache" USING btree ("address_normalized");--> statement-breakpoint
CREATE INDEX "building_cache_dhcr_id_idx" ON "building_cache" USING btree ("dhcr_building_id");--> statement-breakpoint
CREATE INDEX "listings_building_dhcr_id_idx" ON "listings" USING btree ("building_dhcr_id");--> statement-breakpoint
CREATE INDEX "listings_rent_stabilized_status_idx" ON "listings" USING btree ("rent_stabilized_status");