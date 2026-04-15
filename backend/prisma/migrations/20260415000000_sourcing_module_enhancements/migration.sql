-- AlterEnum: Add new SourcingStatus values
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'IN_FULFILMENT';
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "SourcingStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- AlterEnum: Add new BatchStatus values
ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- AlterTable: Add new columns to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "origin" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "moq" DECIMAL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price" DECIMAL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'EUR';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "leadTimeDays" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add new columns to sourcing_requests
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "buyerOrgId" TEXT;
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "supplierNotes" TEXT;

-- AlterTable: Add new columns to batches
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable: Add new columns to recalls
ALTER TABLE "recalls" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'WITHDRAWAL';
ALTER TABLE "recalls" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

-- CreateIndex: Unique constraint on batch code per product
CREATE UNIQUE INDEX IF NOT EXISTS "batches_productId_batchCode_key" ON "batches"("productId", "batchCode");
