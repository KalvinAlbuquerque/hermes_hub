-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN "reminderSubject" TEXT NOT NULL DEFAULT '[LEMBRETE] Pendência em Aberto: [ASSUNTO]';

-- AlterTable
ALTER TABLE "public"."notification_logs" ADD COLUMN "protocol" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_protocol_key" ON "public"."notification_logs"("protocol");