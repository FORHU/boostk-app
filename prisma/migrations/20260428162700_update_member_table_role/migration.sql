/*
  Warnings:

  - You are about to drop the column `roleId` on the `members` table. All the data in the column will be lost.
  - Added the required column `role` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_roleId_fkey";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "roleId",
ADD COLUMN     "customRoleId" TEXT,
ADD COLUMN     "role" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "organizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
