-- CreateEnum
CREATE TYPE "State" AS ENUM ('UNINITIALIZED', 'WAITING_FOR_INITAL_SCRAP', 'SESSION_PENDING', 'WAITING_FOR_FINAL_SCRAP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScrapType" AS ENUM ('INITIAL', 'IN_PROGRESS', 'FINAL');

-- CreateTable
CREATE TABLE "User" (
    "slackId" TEXT NOT NULL,
    "airtableRecId" TEXT NOT NULL,
    "inHuddle" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("slackId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "elapsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "state" "State" NOT NULL DEFAULT 'UNINITIALIZED',
    "airtableRecId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrap" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "shipTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ScrapType" NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Scrap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_airtableRecId_key" ON "User"("airtableRecId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_airtableRecId_key" ON "Session"("airtableRecId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_slackId_fkey" FOREIGN KEY ("slackId") REFERENCES "User"("slackId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_slackId_fkey" FOREIGN KEY ("slackId") REFERENCES "User"("slackId") ON DELETE RESTRICT ON UPDATE CASCADE;

