CREATE TYPE "public"."completeness" AS ENUM('complete', 'incomplete', 'na');--> statement-breakpoint
CREATE TYPE "public"."condition_item" AS ENUM('new_sealed', 'used');--> statement-breakpoint
CREATE TYPE "public"."condition_price" AS ENUM('new', 'used');--> statement-breakpoint
CREATE TYPE "public"."guide_type" AS ENUM('sold', 'stock', 'listing');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('bricklink', 'brickowl');--> statement-breakpoint
CREATE TYPE "public"."retirement_status" AS ENUM('available', 'retiring_soon', 'retired', 'unknown');--> statement-breakpoint
CREATE TABLE "catalog_sets" (
	"set_no" text PRIMARY KEY NOT NULL,
	"name" text,
	"year" integer,
	"theme" text,
	"subtheme" text,
	"piece_count" integer,
	"minifig_count" integer,
	"retail_price" numeric,
	"image_url" text,
	"bricklink_url" text,
	"retirement_status" "retirement_status" DEFAULT 'unknown',
	"retirement_date" date,
	"last_enriched_at" text
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"captured_at" date NOT NULL,
	"total_value" numeric,
	"total_cost" numeric,
	"num_items" integer
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_no" text NOT NULL,
	"condition" "condition_price" NOT NULL,
	"source" "price_source" NOT NULL,
	"guide_type" "guide_type" NOT NULL,
	"currency" text DEFAULT 'EUR',
	"original_currency" text,
	"fx_rate" numeric,
	"avg_price" numeric,
	"min_price" numeric,
	"max_price" numeric,
	"qty_sold" numeric,
	"unit_quantity" integer,
	"captured_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"set_no" text NOT NULL,
	"condition" "condition_item",
	"quantity" integer DEFAULT 1,
	"completeness" "completeness",
	"has_box" boolean,
	"has_instructions" boolean,
	"has_minifigs" boolean,
	"purchase_price" numeric,
	"purchase_date" date,
	"storage_location" text,
	"notes" text,
	"created_at" text DEFAULT now(),
	"updated_at" text DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authentik_uid" text NOT NULL,
	"email" text,
	"display_name" text,
	"currency" text DEFAULT 'EUR',
	"created_at" text DEFAULT now(),
	CONSTRAINT "users_authentik_uid_unique" UNIQUE("authentik_uid")
);
--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_set_no_catalog_sets_set_no_fk" FOREIGN KEY ("set_no") REFERENCES "public"."catalog_sets"("set_no") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_set_no_catalog_sets_set_no_fk" FOREIGN KEY ("set_no") REFERENCES "public"."catalog_sets"("set_no") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_snapshots_unique" ON "portfolio_snapshots" USING btree ("user_id","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "price_snapshots_unique" ON "price_snapshots" USING btree ("set_no","condition","source","guide_type","captured_at");