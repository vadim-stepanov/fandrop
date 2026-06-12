-- CreateEnum
CREATE TYPE "ArtistHomeSectionKey" AS ENUM ('PROMO', 'RULES', 'STORE', 'LEADERBOARD', 'PARTNERS');

-- CreateTable
CREATE TABLE "ArtistHomeSection" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "key" "ArtistHomeSectionKey" NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "subtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistHomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistHomeSection_artistId_sortOrder_idx" ON "ArtistHomeSection"("artistId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistHomeSection_artistId_key_key" ON "ArtistHomeSection"("artistId", "key");

-- AddForeignKey
ALTER TABLE "ArtistHomeSection" ADD CONSTRAINT "ArtistHomeSection_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
