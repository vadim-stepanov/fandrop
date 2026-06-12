-- CreateTable
CREATE TABLE "ArtistLeaderboardConfig" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "topExpandedCount" INTEGER NOT NULL DEFAULT 3,
    "visibleUserCount" INTEGER NOT NULL DEFAULT 10,
    "expandedByDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistLeaderboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistLeaderboardConfig_artistId_key" ON "ArtistLeaderboardConfig"("artistId");

-- AddForeignKey
ALTER TABLE "ArtistLeaderboardConfig" ADD CONSTRAINT "ArtistLeaderboardConfig_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
