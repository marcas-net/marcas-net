-- AlterTable: Add coverImageUrl to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
