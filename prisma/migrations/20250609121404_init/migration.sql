/*
  Warnings:

  - Added the required column `in_time` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `out_time` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "in_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "last_updated_by" UUID,
ADD COLUMN     "out_time" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
