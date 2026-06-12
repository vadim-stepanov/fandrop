-- CreateTable
CREATE TABLE "ArtistPromoVariant" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "bannerUrl" TEXT,
    "videoUrl" TEXT,
    "bannerUrlAnon" TEXT,
    "timerEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistPromoVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistPromoVariant_sectionId_sortOrder_idx" ON "ArtistPromoVariant"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ArtistPromoVariant" ADD CONSTRAINT "ArtistPromoVariant_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ArtistHomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
