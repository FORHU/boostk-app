/*
  Warnings:

  - You are about to drop the column `roleName` on the `organization_role_templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `organization_role_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `organization_role_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "organization_role_templates_roleName_key";

-- AlterTable
ALTER TABLE "organization_role_templates" DROP COLUMN "roleName",
ADD COLUMN     "isSystemRole" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_templates_name_key" ON "organization_role_templates"("name");

-- CreateIndex
CREATE INDEX "organization_role_templates_name_idx" ON "organization_role_templates"("name");

-- CreateIndex
CREATE INDEX "organization_role_templates_isSystemRole_idx" ON "organization_role_templates"("isSystemRole");
