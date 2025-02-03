-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "initalScrap" TEXT,
    "finalScrap" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_slackId_fkey" FOREIGN KEY ("slackId") REFERENCES "User"("slackId") ON DELETE RESTRICT ON UPDATE CASCADE;
