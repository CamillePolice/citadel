import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const client = postgres(url, { max: 1 })
const db = drizzle(client)

await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`)
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`)

const migration0001 = readFileSync('./drizzle/0001_high_deathbird.sql', 'utf8')
const hash0001 = createHash('sha256').update(migration0001).digest('hex')

const rows = await db.execute(sql`
  SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${hash0001}
`)

if (rows.length === 0) {
  // ALTER TYPE ADD VALUE cannot run inside a transaction (PostgreSQL limitation)
  await client`ALTER TYPE "public"."price_source" ADD VALUE IF NOT EXISTS 'avenuedelabrique'`
  await client`ALTER TYPE "public"."price_source" ADD VALUE IF NOT EXISTS 'ebay'`

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "price_listings" (
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
    )
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "price_listings" ADD CONSTRAINT "price_listings_set_no_catalog_sets_set_no_fk"
        FOREIGN KEY ("set_no") REFERENCES "catalog_sets"("set_no") ON DELETE no action ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "price_listings_unique"
    ON "price_listings"("set_no","source","condition","source_listing_id")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "price_listings_set_source_idx"
    ON "price_listings"("set_no","source")
  `)

  await db.execute(sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash0001}, ${Date.now()})
  `)
  console.log('[migrate] 0001 applied')
} else {
  console.log('[migrate] 0001 already applied, skipping')
}

await migrate(db, { migrationsFolder: './drizzle' })
console.log('[migrate] done')
await client.end()
