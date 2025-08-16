-- AlterTable
ALTER TABLE "public"."notification_logs" ADD COLUMN     "emailAccountId" TEXT;

-- CreateTable
CREATE TABLE "public"."email_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpUser" TEXT NOT NULL,
    "smtpPass" TEXT NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_name_key" ON "public"."email_accounts"("name");

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "public"."email_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
