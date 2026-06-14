ALTER TYPE "public"."price_source" ADD VALUE 'avenuedelabrique';--> statement-breakpoint
ALTER TYPE "public"."price_source" ADD VALUE 'ebay';--> statement-breakpoint
CREATE TABLE "price_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_no" text NOT NULL,
	"condition" "condition_price" NOT NULL,
	"source" "price_source" NOT NULL,
	"source_listing_id" text,
	"price" numeric NOT NULL,
	"currency" text DEFAULT 'EUR',
	"sale_date" date,
	"listing_url" text,
	"title" text,
	"captured_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_listings" ADD CONSTRAINT "price_listings_set_no_catalog_sets_set_no_fk" FOREIGN KEY ("set_no") REFERENCES "public"."catalog_sets"("set_no") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "price_listings_unique" ON "price_listings" USING btree ("set_no","source","condition","source_listing_id");--> statement-breakpoint
CREATE INDEX "price_listings_set_source_idx" ON "price_listings" USING btree ("set_no","source");