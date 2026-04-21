-- Add verifiedAt and verifiedBy to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;

-- CreateEnum: LotStatus
DO $$ BEGIN
  CREATE TYPE "LotStatus" AS ENUM ('OPEN', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: LoadStatus
DO $$ BEGIN
  CREATE TYPE "LoadStatus" AS ENUM ('PLANNING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'RECALLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: lots
CREATE TABLE IF NOT EXISTS "lots" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "buyerOrgId" TEXT,
    "totalQuantity" DECIMAL NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: loads
CREATE TABLE IF NOT EXISTS "loads" (
    "id" TEXT NOT NULL,
    "loadCode" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'PLANNING',
    "eta" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "lots_lotCode_key" ON "lots"("lotCode");
CREATE UNIQUE INDEX IF NOT EXISTS "lots_requestId_key" ON "lots"("requestId");
CREATE UNIQUE INDEX IF NOT EXISTS "loads_loadCode_key" ON "loads"("loadCode");

-- AddForeignKey: lots → organizations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lots_organizationId_fkey') THEN
    ALTER TABLE "lots" ADD CONSTRAINT "lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: lots → sourcing_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lots_requestId_fkey') THEN
    ALTER TABLE "lots" ADD CONSTRAINT "lots_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sourcing_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: loads → lots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loads_lotId_fkey') THEN
    ALTER TABLE "loads" ADD CONSTRAINT "loads_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
