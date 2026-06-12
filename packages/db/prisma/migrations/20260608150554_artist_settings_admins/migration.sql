-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntityType" ADD VALUE 'ARTIST';
ALTER TYPE "AuditEntityType" ADD VALUE 'ARTIST_ADMIN_GRANT';

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "signupBonusPoints" INTEGER NOT NULL DEFAULT 0;
