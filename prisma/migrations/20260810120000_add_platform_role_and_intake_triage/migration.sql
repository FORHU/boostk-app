-- AlterTable
ALTER TABLE "users" ADD COLUMN     "platformRole" TEXT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "intakeTicketId" TEXT,
ADD COLUMN     "routedAt" TIMESTAMP(3),
ADD COLUMN     "triagedById" TEXT,
ADD COLUMN     "triageNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tickets_intakeTicketId_key" ON "tickets"("intakeTicketId");

-- CreateIndex
CREATE INDEX "tickets_projectId_status_idx" ON "tickets"("projectId", "status");

-- CreateIndex
CREATE INDEX "tickets_triagedById_idx" ON "tickets"("triagedById");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_intakeTicketId_fkey" FOREIGN KEY ("intakeTicketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_triagedById_fkey" FOREIGN KEY ("triagedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
