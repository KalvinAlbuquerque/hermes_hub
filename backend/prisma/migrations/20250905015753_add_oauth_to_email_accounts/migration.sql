-- AlterTable
ALTER TABLE "public"."email_accounts" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "authType" TEXT NOT NULL DEFAULT 'PASSWORD',
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3),
ALTER COLUMN "smtpHost" DROP NOT NULL,
ALTER COLUMN "smtpPort" DROP NOT NULL,
ALTER COLUMN "smtpUser" DROP NOT NULL,
ALTER COLUMN "smtpPass" DROP NOT NULL,
ALTER COLUMN "smtpSecure" DROP NOT NULL;
