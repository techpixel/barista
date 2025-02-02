/*
  Warnings:

  - You are about to drop the column `inHuddle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "inHuddle",
DROP COLUMN "joinedAt";

-- CreateTable
CREATE TABLE "Call" (
    "id" SERIAL NOT NULL,
    "callId" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "inCall" BOOLEAN NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "slackId" TEXT NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_slackId_fkey" FOREIGN KEY ("slackId") REFERENCES "User"("slackId") ON DELETE RESTRICT ON UPDATE CASCADE;
