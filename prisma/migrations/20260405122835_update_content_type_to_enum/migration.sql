/*
  Warnings:

  - The `contentType` column on the `ticket_messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TicketMessageContentType" AS ENUM ('TEXT', 'IMAGE', 'FILE');

-- AlterTable
ALTER TABLE "ticket_messages" DROP COLUMN "contentType",
ADD COLUMN     "contentType" "TicketMessageContentType" NOT NULL DEFAULT 'TEXT';
