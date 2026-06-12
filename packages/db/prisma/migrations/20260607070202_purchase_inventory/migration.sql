-- CreateTable
CREATE TABLE "ArtistInventoryItem" (
    "id" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "storeItemId" TEXT,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "StoreCategory" NOT NULL,
    "quality" "StoreQuality" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistPurchase" (
    "id" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "storeItemId" TEXT,
    "priceMode" "StorePriceMode" NOT NULL,
    "pointsSpent" INTEGER,
    "amountCents" INTEGER,
    "currencyCode" TEXT,
    "loyaltyAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistInventoryItem_purchaseId_key" ON "ArtistInventoryItem"("purchaseId");

-- CreateIndex
CREATE INDEX "ArtistInventoryItem_artistUserId_acquiredAt_idx" ON "ArtistInventoryItem"("artistUserId", "acquiredAt");

-- CreateIndex
CREATE INDEX "ArtistPurchase_artistUserId_createdAt_idx" ON "ArtistPurchase"("artistUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "ArtistInventoryItem" ADD CONSTRAINT "ArtistInventoryItem_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "ArtistUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistInventoryItem" ADD CONSTRAINT "ArtistInventoryItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ArtistPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistInventoryItem" ADD CONSTRAINT "ArtistInventoryItem_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "ArtistStoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPurchase" ADD CONSTRAINT "ArtistPurchase_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "ArtistUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPurchase" ADD CONSTRAINT "ArtistPurchase_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "ArtistStoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
