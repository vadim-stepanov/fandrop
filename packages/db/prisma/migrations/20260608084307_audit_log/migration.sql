-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ADJUST_POINTS', 'WIPE_USER', 'UPDATE_SETTINGS');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('ARTIST_USER', 'ARTIST_HOME_SECTION', 'ARTIST_PROMO_VARIANT', 'ARTIST_RULE_ITEM', 'ARTIST_PARTNER_ITEM', 'ARTIST_STORE_ITEM', 'ARTIST_SOCIAL_LINK', 'ARTIST_LEADERBOARD_CONFIG', 'ARTIST_REFERRAL_SETTINGS', 'ARTIST_POINTS_TRANSACTION');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUserId" TEXT,
    "artistId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforePayload" JSONB,
    "afterPayload" JSONB,
    "reason" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_artistId_createdAt_idx" ON "AuditLog"("artistId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
