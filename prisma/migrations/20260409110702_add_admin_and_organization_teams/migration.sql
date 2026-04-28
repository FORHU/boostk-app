-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "activeTeamId" TEXT,
ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT;

-- CreateTable
CREATE TABLE "organizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "organizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "teamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizationRole_organizationId_idx" ON "organizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "organizationRole_role_idx" ON "organizationRole"("role");

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "teamMember_teamId_idx" ON "teamMember"("teamId");

-- CreateIndex
CREATE INDEX "teamMember_userId_idx" ON "teamMember"("userId");

-- AddForeignKey
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
