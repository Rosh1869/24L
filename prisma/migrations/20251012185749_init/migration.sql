/*
  Warnings:

  - You are about to drop the column `userId` on the `Worklog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Worklog" DROP CONSTRAINT "Worklog_userId_fkey";

-- AlterTable
ALTER TABLE "Worklog" DROP COLUMN "userId";
