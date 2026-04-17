-- AlterTable
ALTER TABLE "users" ADD COLUMN     "globalRoleId" TEXT;

-- CreateTable
CREATE TABLE "global_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_roles_name_key" ON "global_roles"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_globalRoleId_fkey" FOREIGN KEY ("globalRoleId") REFERENCES "global_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
