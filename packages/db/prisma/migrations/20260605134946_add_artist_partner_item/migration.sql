-- CreateTable
CREATE TABLE "ArtistPartnerItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistPartnerItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistPartnerItem_sectionId_sortOrder_idx" ON "ArtistPartnerItem"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ArtistPartnerItem" ADD CONSTRAINT "ArtistPartnerItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ArtistHomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
