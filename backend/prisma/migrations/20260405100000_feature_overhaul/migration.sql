-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('POST', 'POLL', 'EVENT');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPOST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'JOB';

-- AlterTable: Post additions
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "type" "PostType" NOT NULL DEFAULT 'POST';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "repostOfId" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "pollQuestion" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "pollEndsAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "eventTitle" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "eventLocation" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "eventLink" TEXT;

-- AlterTable: Job additions
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "postedById" TEXT;

-- AddForeignKey: Post repost
ALTER TABLE "posts" ADD CONSTRAINT "posts_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Job postedBy
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: PollOption
CREATE TABLE IF NOT EXISTS "poll_options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PollVote
CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobApplication
CREATE TABLE IF NOT EXISTS "job_applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_userId_optionId_key" ON "poll_votes"("userId", "optionId");
CREATE UNIQUE INDEX IF NOT EXISTS "job_applications_userId_jobId_key" ON "job_applications"("userId", "jobId");
