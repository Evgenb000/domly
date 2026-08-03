/*
  Warnings:

  - The values [PENDING] on the enum `ModerationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModerationStatus_new" AS ENUM ('APPROVED', 'REJECTED');
ALTER TABLE "public"."properties" ALTER COLUMN "moderationStatus" DROP DEFAULT;
ALTER TABLE "properties" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus_new" USING ("moderationStatus"::text::"ModerationStatus_new");
ALTER TYPE "ModerationStatus" RENAME TO "ModerationStatus_old";
ALTER TYPE "ModerationStatus_new" RENAME TO "ModerationStatus";
DROP TYPE "public"."ModerationStatus_old";
ALTER TABLE "properties" ALTER COLUMN "moderationStatus" SET DEFAULT 'APPROVED';
COMMIT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "hasDeposit" BOOLEAN,
ALTER COLUMN "moderationStatus" SET DEFAULT 'APPROVED';
