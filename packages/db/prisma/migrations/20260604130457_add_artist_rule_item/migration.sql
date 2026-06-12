-- CreateTable
CREATE TABLE "ArtistRuleItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "stepNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistRuleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistRuleItem_sectionId_stepNumber_idx" ON "ArtistRuleItem"("sectionId", "stepNumber");

-- AddForeignKey
ALTER TABLE "ArtistRuleItem" ADD CONSTRAINT "ArtistRuleItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ArtistHomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
