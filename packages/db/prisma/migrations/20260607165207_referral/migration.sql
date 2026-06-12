-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "referralEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralRewardPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ArtistUser" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredByArtistUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ArtistUser_referralCode_key" ON "ArtistUser"("referralCode");

-- CreateIndex
CREATE INDEX "ArtistUser_referredByArtistUserId_idx" ON "ArtistUser"("referredByArtistUserId");

-- AddForeignKey
ALTER TABLE "ArtistUser" ADD CONSTRAINT "ArtistUser_referredByArtistUserId_fkey" FOREIGN KEY ("referredByArtistUserId") REFERENCES "ArtistUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

