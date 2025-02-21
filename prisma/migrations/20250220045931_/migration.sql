/*
  Warnings:

  - The values [UNINITIALIZED] on the enum `State` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "State_new" AS ENUM ('WAITING_FOR_INITAL_SCRAP', 'SESSION_PENDING', 'WAITING_FOR_FINAL_SCRAP', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Session" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "Session" ALTER COLUMN "state" TYPE "State_new" USING ("state"::text::"State_new");
ALTER TYPE "State" RENAME TO "State_old";
ALTER TYPE "State_new" RENAME TO "State";
DROP TYPE "State_old";
COMMIT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "state" DROP DEFAULT;
