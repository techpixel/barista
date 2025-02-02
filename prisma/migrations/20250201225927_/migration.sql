-- CreateTable
CREATE TABLE "User" (
    "slackId" TEXT NOT NULL,
    "inHuddle" BOOLEAN NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("slackId")
);
