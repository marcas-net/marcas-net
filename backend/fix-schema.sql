-- Ensure all required columns exist (idempotent)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;
ALTER TABLE "post_media" ADD COLUMN IF NOT EXISTS "publicId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "headline" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'skills'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END
$$;

-- Add username column (idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Backfill usernames for users that don't have one yet
UPDATE "users"
SET "username" = LOWER(REGEXP_REPLACE(
  COALESCE(NULLIF(TRIM("name"), ''), SPLIT_PART("email", '@', 1)),
  '[^a-zA-Z0-9]', '_', 'g'
)) || '_' || SUBSTRING("id", 1, 6)
WHERE "username" IS NULL;

-- Add unique index if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_username_key'
  ) THEN
    CREATE UNIQUE INDEX users_username_key ON "users"("username");
  END IF;
END
$$;
