-- AlterTable
ALTER TABLE "public"."notification_logs" ADD COLUMN     "incidentStatus" TEXT NOT NULL DEFAULT 'OPEN';
