-- DropIndex
DROP INDEX "ArtistStoreItem_sectionId_sortOrder_idx";
DROP INDEX "ArtistPromoVariant_sectionId_sortOrder_idx";

-- AlterTable
ALTER TABLE "ArtistStoreItem" DROP COLUMN "sortOrder";
ALTER TABLE "ArtistPromoVariant" DROP COLUMN "sortOrder";

-- CreateIndex
CREATE INDEX "ArtistStoreItem_sectionId_createdAt_idx" ON "ArtistStoreItem"("sectionId", "createdAt");
CREATE INDEX "ArtistPromoVariant_sectionId_createdAt_idx" ON "ArtistPromoVariant"("sectionId", "createdAt");
