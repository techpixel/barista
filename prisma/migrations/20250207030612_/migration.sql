/*
  Warnings:

  - You are about to drop the column `paused` on the `Session` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "State" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "paused";
