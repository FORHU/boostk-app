-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "originalLanguage" TEXT,
ADD COLUMN     "translatedContent" TEXT;
