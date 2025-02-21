/*
  Warnings:

  - Added the required column `state` to the `Scrap` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Scrap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ScrapState" AS ENUM ('INITIAL', 'IN_PROGRESS', 'FINAL');

-- AlterTable
ALTER TABLE "Scrap" ADD COLUMN     "state" "ScrapState" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ScrapType";
