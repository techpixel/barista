/*
  Warnings:

  - The values [INITAL] on the enum `ScrapType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScrapType_new" AS ENUM ('INITIAL', 'IN_PROGRESS', 'FINAL');
ALTER TABLE "Scrap" ALTER COLUMN "type" TYPE "ScrapType_new" USING ("type"::text::"ScrapType_new");
ALTER TYPE "ScrapType" RENAME TO "ScrapType_old";
ALTER TYPE "ScrapType_new" RENAME TO "ScrapType";
DROP TYPE "ScrapType_old";
COMMIT;
