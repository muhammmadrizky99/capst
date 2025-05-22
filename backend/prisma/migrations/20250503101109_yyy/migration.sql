/*
  Warnings:

  - You are about to drop the column `answerId` on the `Recommendation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Recommendation" DROP CONSTRAINT "Recommendation_answerId_fkey";

-- AlterTable
ALTER TABLE "Recommendation" DROP COLUMN "answerId";
