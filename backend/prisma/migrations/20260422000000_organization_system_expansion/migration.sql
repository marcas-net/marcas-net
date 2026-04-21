-- Organization System Expansion
-- Adds: User.headline, User.skills[], Organization.coverImageUrl

-- AlterTable users
ALTER TABLE "users" ADD COLUMN "headline" TEXT;
ALTER TABLE "users" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT '{}';

-- AlterTable organizations
ALTER TABLE "organizations" ADD COLUMN "cover_image_url" TEXT;
