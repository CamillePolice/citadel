DO $$ BEGIN
  CREATE TYPE "storage_space_type" AS ENUM ('shelf', 'drawer', 'box', 'room');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "storage_spaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" "storage_space_type" NOT NULL DEFAULT 'shelf',
  "rows" integer,
  "cols" integer,
  "description" text,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "user_items"
  ADD COLUMN IF NOT EXISTS "storage_space_id" uuid REFERENCES "storage_spaces"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "storage_row" integer,
  ADD COLUMN IF NOT EXISTS "storage_col" integer;
