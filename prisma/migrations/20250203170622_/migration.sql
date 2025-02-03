/*
  Warnings:

  - The `initalScrap` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `finalScrap` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "initalScrap",
ADD COLUMN     "initalScrap" JSONB,
DROP COLUMN "finalScrap",
ADD COLUMN     "finalScrap" JSONB;
