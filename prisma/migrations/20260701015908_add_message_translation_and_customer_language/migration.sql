-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "sourceLang" TEXT,
ADD COLUMN     "targetLang" TEXT,
ADD COLUMN     "translatedContent" TEXT;
