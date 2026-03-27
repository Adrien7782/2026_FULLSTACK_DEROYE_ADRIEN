-- Phase 8: Social features — Follow system + MediaRecommendation + User/Notification fields

-- User new fields
ALTER TABLE "User" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notifyOnNewMedia" BOOLEAN NOT NULL DEFAULT false;

-- Notification new field
ALTER TABLE "Notification" ADD COLUMN "relatedId" TEXT;

-- New enum values on NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'follow_request';
ALTER TYPE "NotificationType" ADD VALUE 'follow_accepted';
ALTER TYPE "NotificationType" ADD VALUE 'new_media';
ALTER TYPE "NotificationType" ADD VALUE 'new_recommendation';

-- New enum FollowStatus
CREATE TYPE "FollowStatus" AS ENUM ('pending', 'accepted');

-- Follow table
CREATE TABLE "Follow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followedId" TEXT NOT NULL,
  "status" "FollowStatus" NOT NULL DEFAULT 'accepted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Follow_followerId_followedId_key" ON "Follow"("followerId", "followedId");
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX "Follow_followedId_idx" ON "Follow"("followedId");
ALTER TABLE "Follow"
  ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Follow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MediaRecommendation table
CREATE TABLE "MediaRecommendation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaRecommendation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaRecommendation_userId_key" ON "MediaRecommendation"("userId");
CREATE INDEX "MediaRecommendation_mediaId_idx" ON "MediaRecommendation"("mediaId");
CREATE INDEX "MediaRecommendation_createdAt_idx" ON "MediaRecommendation"("createdAt");
ALTER TABLE "MediaRecommendation"
  ADD CONSTRAINT "MediaRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MediaRecommendation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
