-- AlterEnum
ALTER TYPE "ArtistPointsTransactionKind" ADD VALUE 'SOCIAL_CONNECT';

-- CreateTable
CREATE TABLE "SocialPlatform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistSocialLink" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "socialPlatformId" TEXT NOT NULL,
    "connectBonus" INTEGER NOT NULL DEFAULT 500,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistSocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistUserSocialConnection" (
    "id" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "artistSocialLinkId" TEXT NOT NULL,
    "externalHandleOrUrl" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistUserSocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlatform_slug_key" ON "SocialPlatform"("slug");

-- CreateIndex
CREATE INDEX "ArtistSocialLink_artistId_sortOrder_idx" ON "ArtistSocialLink"("artistId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistSocialLink_artistId_socialPlatformId_key" ON "ArtistSocialLink"("artistId", "socialPlatformId");

-- CreateIndex
CREATE INDEX "ArtistUserSocialConnection_artistSocialLinkId_idx" ON "ArtistUserSocialConnection"("artistSocialLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistUserSocialConnection_artistUserId_artistSocialLinkId_key" ON "ArtistUserSocialConnection"("artistUserId", "artistSocialLinkId");

-- AddForeignKey
ALTER TABLE "ArtistSocialLink" ADD CONSTRAINT "ArtistSocialLink_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSocialLink" ADD CONSTRAINT "ArtistSocialLink_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistUserSocialConnection" ADD CONSTRAINT "ArtistUserSocialConnection_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "ArtistUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistUserSocialConnection" ADD CONSTRAINT "ArtistUserSocialConnection_artistSocialLinkId_fkey" FOREIGN KEY ("artistSocialLinkId") REFERENCES "ArtistSocialLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
