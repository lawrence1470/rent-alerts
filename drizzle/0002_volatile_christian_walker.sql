CREATE TABLE "payment_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"check_interval" text NOT NULL,
	"price_per_week" integer NOT NULL,
	"checks_per_day" integer NOT NULL,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"weeks_purchased" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"access_period_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "purchases_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "purchases_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "user_access_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "preferred_frequency" text DEFAULT '1hour' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_tier_id_payment_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."payment_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_access_period_id_user_access_periods_id_fk" FOREIGN KEY ("access_period_id") REFERENCES "public"."user_access_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_periods" ADD CONSTRAINT "user_access_periods_tier_id_payment_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."payment_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_tiers_is_active_idx" ON "payment_tiers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "purchases_user_id_idx" ON "purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchases_tier_id_idx" ON "purchases" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "purchases_status_idx" ON "purchases" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_stripe_payment_intent_idx" ON "purchases" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_stripe_checkout_session_idx" ON "purchases" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "user_access_periods_user_id_idx" ON "user_access_periods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_access_periods_tier_id_idx" ON "user_access_periods" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "user_access_periods_status_idx" ON "user_access_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_access_periods_expires_at_idx" ON "user_access_periods" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_access_periods_active_idx" ON "user_access_periods" USING btree ("user_id","status","expires_at");