-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emails" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ClienteToNotificationLog" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClienteToNotificationLog_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_name_key" ON "public"."clientes"("name");

-- CreateIndex
CREATE INDEX "_ClienteToNotificationLog_B_index" ON "public"."_ClienteToNotificationLog"("B");

-- AddForeignKey
ALTER TABLE "public"."_ClienteToNotificationLog" ADD CONSTRAINT "_ClienteToNotificationLog_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ClienteToNotificationLog" ADD CONSTRAINT "_ClienteToNotificationLog_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."notification_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
