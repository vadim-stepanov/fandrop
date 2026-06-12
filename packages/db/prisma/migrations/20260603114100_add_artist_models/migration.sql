-- CreateEnum
CREATE TYPE "ArtistRole" AS ENUM ('USER', 'ARTIST_ADMIN');

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistUser" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ArtistRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistAdminGrant" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistAdminGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "ArtistUser_userId_idx" ON "ArtistUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistUser_artistId_userId_key" ON "ArtistUser"("artistId", "userId");

-- CreateIndex
CREATE INDEX "ArtistAdminGrant_email_idx" ON "ArtistAdminGrant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistAdminGrant_artistId_email_key" ON "ArtistAdminGrant"("artistId", "email");

-- AddForeignKey
ALTER TABLE "ArtistUser" ADD CONSTRAINT "ArtistUser_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistUser" ADD CONSTRAINT "ArtistUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistAdminGrant" ADD CONSTRAINT "ArtistAdminGrant_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
