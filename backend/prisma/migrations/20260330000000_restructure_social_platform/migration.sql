-- DropTable (services removed - no marketplace)
DROP TABLE IF EXISTS "services";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "SourcingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'RECALLED');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'DATE', 'TEXTAREA', 'CHECKBOX');

-- AlterEnum (add new notification types)
ALTER TYPE "NotificationType" ADD VALUE 'LIKE';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW';
ALTER TYPE "NotificationType" ADD VALUE 'SOURCING';
ALTER TYPE "NotificationType" ADD VALUE 'RECALL';

-- AlterTable: posts - remove title column
ALTER TABLE "posts" DROP COLUMN IF EXISTS "title";

-- AlterTable: products - add unit column
ALTER TABLE "products" ADD COLUMN "unit" TEXT;

-- AlterTable: batches - add new columns
-- First update existing rows to have a batchCode if null
UPDATE "batches" SET "batchCode" = "id" WHERE "batchCode" IS NULL;
ALTER TABLE "batches" ALTER COLUMN "batchCode" SET NOT NULL;
ALTER TABLE "batches" ADD COLUMN "totalQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "batches" ADD COLUMN "availableQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "batches" ADD COLUMN "productionDate" TIMESTAMP(3);
ALTER TABLE "batches" ADD COLUMN "expiryDate" TIMESTAMP(3);
ALTER TABLE "batches" ADD COLUMN "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE';

-- Update batches FK to cascade delete
ALTER TABLE "batches" DROP CONSTRAINT IF EXISTS "batches_productId_fkey";
ALTER TABLE "batches" ADD CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: memberships
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");

-- CreateTable: comments
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: likes
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "likes"("userId", "postId");

-- CreateTable: follows
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingUserId" TEXT,
    "followingOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingUserId_key" ON "follows"("followerId", "followingUserId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingOrgId_key" ON "follows"("followerId", "followingOrgId");

-- CreateTable: conversations
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participant1Id_participant2Id_key" ON "conversations"("participant1Id", "participant2Id");

-- CreateTable: messages
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sourcing_requests
CREATE TABLE "sourcing_requests" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "message" TEXT,
    "status" "SourcingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: batch_allocations
CREATE TABLE "batch_allocations" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "allocatedQuantity" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: form_templates
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: form_fields
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable: form_entries
CREATE TABLE "form_entries" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: form_values
CREATE TABLE "form_values" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "form_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable: recalls
CREATE TABLE "recalls" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recalls_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: memberships
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: comments
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: likes
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: follows
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingUserId_fkey" FOREIGN KEY ("followingUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingOrgId_fkey" FOREIGN KEY ("followingOrgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: conversations
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: messages
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: sourcing_requests
ALTER TABLE "sourcing_requests" ADD CONSTRAINT "sourcing_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sourcing_requests" ADD CONSTRAINT "sourcing_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sourcing_requests" ADD CONSTRAINT "sourcing_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: batch_allocations
ALTER TABLE "batch_allocations" ADD CONSTRAINT "batch_allocations_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batch_allocations" ADD CONSTRAINT "batch_allocations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sourcing_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: form_templates
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: form_fields
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: form_entries
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: form_values
ALTER TABLE "form_values" ADD CONSTRAINT "form_values_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "form_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: recalls
ALTER TABLE "recalls" ADD CONSTRAINT "recalls_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recalls" ADD CONSTRAINT "recalls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recalls" ADD CONSTRAINT "recalls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
