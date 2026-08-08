/*
  Warnings:

  - Made the column `effectivePrice` on table `properties` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "effectivePrice" SET NOT NULL;

-- CreateIndex
CREATE INDEX "properties_effectivePrice_idx" ON "properties"("effectivePrice");
