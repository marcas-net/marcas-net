-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
