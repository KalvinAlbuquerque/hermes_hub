-- AlterTable
ALTER TABLE "public"."notification_logs" ADD COLUMN "messageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_messageId_key" ON "public"."notification_logs"("messageId");