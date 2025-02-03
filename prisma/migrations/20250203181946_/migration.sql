/*
  Warnings:

  - Added the required column `slackId` to the `Scrap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scrap" ADD COLUMN     "slackId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_slackId_fkey" FOREIGN KEY ("slackId") REFERENCES "User"("slackId") ON DELETE RESTRICT ON UPDATE CASCADE;
