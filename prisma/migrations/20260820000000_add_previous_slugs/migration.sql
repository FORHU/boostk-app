-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "previousSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "previousSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
