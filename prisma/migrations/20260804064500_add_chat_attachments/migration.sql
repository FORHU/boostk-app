-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_ticketId_idx" ON "attachments"("ticketId");

-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "attachmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ticket_messages_attachmentId_key" ON "ticket_messages"("attachmentId");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
