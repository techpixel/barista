/*
  Warnings:

  - Made the column `lastUpdate` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "lastUpdate" SET NOT NULL;
