/*
  Warnings:

  - You are about to drop the column `created_at` on the `Worklog` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Worklog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Worklog" DROP CONSTRAINT "Worklog_userId_fkey";

-- AlterTable
ALTER TABLE "Worklog" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "hours" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Worklog" ADD CONSTRAINT "Worklog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
