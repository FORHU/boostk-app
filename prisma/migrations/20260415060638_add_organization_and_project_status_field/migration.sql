-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';
