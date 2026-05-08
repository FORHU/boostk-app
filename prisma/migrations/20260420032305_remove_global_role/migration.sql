/*
  Warnings:

  - You are about to drop the column `globalRoleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `global_roles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,organizationId]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,userId]` on the table `teamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_globalRoleId_fkey";

-- AlterTable
ALTER TABLE "team" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "globalRoleId";

-- DropTable
DROP TABLE "global_roles";

-- CreateIndex
CREATE UNIQUE INDEX "members_userId_organizationId_key" ON "members"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "teamMember_teamId_userId_key" ON "teamMember"("teamId", "userId");
