-- Ensure all required columns exist (idempotent)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;
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
