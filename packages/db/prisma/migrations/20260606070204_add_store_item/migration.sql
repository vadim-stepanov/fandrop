-- CreateEnum
CREATE TYPE "StoreCategory" AS ENUM ('MERCH', 'DIGITAL', 'EXPERIENCES');

-- CreateEnum
CREATE TYPE "StoreQuality" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "StorePriceMode" AS ENUM ('MONEY', 'POINTS');

-- CreateTable
CREATE TABLE "ArtistStoreItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "StoreCategory" NOT NULL,
    "quality" "StoreQuality" NOT NULL DEFAULT 'COMMON',
    "priceMode" "StorePriceMode" NOT NULL DEFAULT 'MONEY',
    "priceAmountCents" INTEGER,
    "currencyCode" TEXT,
    "pointsPrice" INTEGER,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "stockCount" INTEGER,
    "leftAlert" INTEGER,
    "salesStartAt" TIMESTAMP(3),
    "featuredPos" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistStoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistStoreItem_sectionId_sortOrder_idx" ON "ArtistStoreItem"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtistStoreItem_sectionId_featuredPos_idx" ON "ArtistStoreItem"("sectionId", "featuredPos");

-- AddForeignKey
ALTER TABLE "ArtistStoreItem" ADD CONSTRAINT "ArtistStoreItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ArtistHomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
