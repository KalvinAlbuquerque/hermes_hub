/*
  Warnings:

  - You are about to drop the column `recipientEmail` on the `notification_logs` table. All the data in the column will be lost.
  - You are about to drop the column `sentByUserId` on the `notification_logs` table. All the data in the column will be lost.
  - Added the required column `body` to the `notification_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipients` to the `notification_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `notification_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedByUserId` to the `notification_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."notification_logs" DROP CONSTRAINT "notification_logs_sentByUserId_fkey";

-- AlterTable
ALTER TABLE "public"."notification_logs" DROP COLUMN "recipientEmail",
DROP COLUMN "sentByUserId",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recipients" JSONB NOT NULL,
ADD COLUMN     "subject" TEXT NOT NULL,
ADD COLUMN     "submittedByUserId" TEXT NOT NULL,
ALTER COLUMN "sentAt" DROP NOT NULL,
ALTER COLUMN "sentAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
