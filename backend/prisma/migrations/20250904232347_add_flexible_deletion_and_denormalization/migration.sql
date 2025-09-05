-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."notification_logs" DROP CONSTRAINT "notification_logs_submittedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."notification_logs" DROP CONSTRAINT "notification_logs_templateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."templates" DROP CONSTRAINT "templates_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."templates" DROP CONSTRAINT "templates_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."audit_logs" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."notification_logs" ALTER COLUMN "templateId" DROP NOT NULL,
ALTER COLUMN "submittedByUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."templates" ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
