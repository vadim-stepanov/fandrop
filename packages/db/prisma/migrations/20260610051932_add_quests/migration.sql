-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CLAIMED');

-- AlterEnum
ALTER TYPE "ArtistHomeSectionKey" ADD VALUE 'QUESTS';

-- AlterEnum
ALTER TYPE "ArtistPointsTransactionKind" ADD VALUE 'QUEST_REWARD';

-- CreateTable
CREATE TABLE "ArtistQuest" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "imageUrl" TEXT,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3),
    "featuredPos" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistUserQuest" (
    "id" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistUserQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistQuest_sectionId_createdAt_idx" ON "ArtistQuest"("sectionId", "createdAt");

-- CreateIndex
CREATE INDEX "ArtistQuest_sectionId_featuredPos_idx" ON "ArtistQuest"("sectionId", "featuredPos");

-- CreateIndex
CREATE INDEX "ArtistUserQuest_artistUserId_idx" ON "ArtistUserQuest"("artistUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistUserQuest_artistUserId_questId_key" ON "ArtistUserQuest"("artistUserId", "questId");

-- AddForeignKey
ALTER TABLE "ArtistQuest" ADD CONSTRAINT "ArtistQuest_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ArtistHomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistUserQuest" ADD CONSTRAINT "ArtistUserQuest_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "ArtistUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistUserQuest" ADD CONSTRAINT "ArtistUserQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "ArtistQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
