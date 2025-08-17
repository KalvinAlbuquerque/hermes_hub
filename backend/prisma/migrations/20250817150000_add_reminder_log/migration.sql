-- CreateTable
CREATE TABLE "public"."reminder_logs" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationLogId" TEXT NOT NULL,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."reminder_logs" ADD CONSTRAINT "reminder_logs_notificationLogId_fkey" FOREIGN KEY ("notificationLogId") REFERENCES "public"."notification_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;