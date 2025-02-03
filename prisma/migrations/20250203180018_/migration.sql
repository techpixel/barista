/*
  Warnings:

  - Added the required column `state` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "State" AS ENUM ('UNINITIALIZED');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "state" "State" NOT NULL;
