/*
  Warnings:

  - You are about to drop the column `externalId` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiKey]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referenceId]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `referenceId` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_externalId_key";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "externalId",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "referenceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "projects_apiKey_key" ON "projects"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_referenceId_key" ON "tickets"("referenceId");
