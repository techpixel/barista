/*
  Warnings:

  - You are about to drop the column `data` on the `Scrap` table. All the data in the column will be lost.
  - You are about to drop the column `shipTime` on the `Scrap` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `Scrap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Scrap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ts` to the `Scrap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scrap" DROP COLUMN "data",
DROP COLUMN "shipTime",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "files" TEXT[],
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "ts" TEXT NOT NULL;
