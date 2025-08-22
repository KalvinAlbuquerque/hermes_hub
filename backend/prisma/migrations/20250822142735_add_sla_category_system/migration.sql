-- AlterTable
ALTER TABLE "public"."notification_logs" ADD COLUMN     "nextReminderAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."templates" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reminderMode" TEXT NOT NULL,
    "reminderIntervalHours" INTEGER,
    "reminderSpecificTime" TEXT,
    "reminderTemplateBody" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
