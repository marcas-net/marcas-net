-- AlterTable
ALTER TABLE "batches" ALTER COLUMN "totalQuantity" DROP DEFAULT,
ALTER COLUMN "availableQuantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT;
