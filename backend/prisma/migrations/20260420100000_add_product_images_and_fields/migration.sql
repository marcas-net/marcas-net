-- Add missing product columns
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shelfLifeMonths" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specifications" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shippingPorts" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packagingOptions" TEXT[] DEFAULT '{}';

-- CreateTable: product_images
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_productId_fkey') THEN
    ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
