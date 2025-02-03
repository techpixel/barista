/*
  Warnings:

  - You are about to drop the column `finalScrap` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `initalScrap` on the `Session` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ScrapType" AS ENUM ('INITAL', 'IN_PROGRESS', 'FINAL');

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "finalScrap",
DROP COLUMN "initalScrap";

-- CreateTable
CREATE TABLE "Scrap" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "ScrapType" NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Scrap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
