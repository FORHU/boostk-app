/*
  Warnings:

  - Added the required column `gender` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "GenderType" NOT NULL;
