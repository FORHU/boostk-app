-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "assignedAgentId" TEXT;

-- CreateIndex
CREATE INDEX "tickets_assignedAgentId_idx" ON "tickets"("assignedAgentId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
