/*
  Warnings:

  - A unique constraint covering the columns `[cityId,name]` on the table `districts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cityId` to the `districts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "districts_name_key";

-- AlterTable
ALTER TABLE "districts" ADD COLUMN     "cityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE INDEX "districts_cityId_idx" ON "districts"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_cityId_name_key" ON "districts"("cityId", "name");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
