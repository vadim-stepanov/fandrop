-- CreateEnum
CREATE TYPE "ArtistPointsTransactionKind" AS ENUM ('WELCOME_BONUS', 'REFERRAL_REWARD', 'PURCHASE_REWARD', 'POINTS_SPEND', 'ADMIN_ADJUSTMENT');

-- CreateTable
CREATE TABLE "ArtistPointsTransaction" (
    "id" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" "ArtistPointsTransactionKind" NOT NULL,
    "description" TEXT,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistPointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistPointsTransaction_artistUserId_createdAt_idx" ON "ArtistPointsTransaction"("artistUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "ArtistPointsTransaction" ADD CONSTRAINT "ArtistPointsTransaction_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "ArtistUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
