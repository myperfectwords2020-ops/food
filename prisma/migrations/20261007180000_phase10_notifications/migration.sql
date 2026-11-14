-- Phase 10: notifications

CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'IN_APP', 'SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');
CREATE TYPE "NotificationPurpose" AS ENUM ('TRANSACTIONAL', 'MARKETING', 'SUPPORT');
CREATE TYPE "NotificationTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "NotificationTemplate" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "providerTemplateId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "NotificationTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "variables" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationTemplate_tenantId_key_channel_version_key"
  ON "NotificationTemplate"("tenantId", "key", "channel", "version");
CREATE INDEX "NotificationTemplate_tenantId_key_channel_status_idx"
  ON "NotificationTemplate"("tenantId", "key", "channel", "status");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT,
  "userId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "type" TEXT NOT NULL,
  "purpose" "NotificationPurpose" NOT NULL DEFAULT 'TRANSACTIONAL',
  "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
  "templateId" TEXT,
  "templateVersion" INTEGER,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "recipient" TEXT NOT NULL,
  "subject" TEXT,
  "payload" JSONB NOT NULL,
  "metadata" JSONB,
  "idempotencyKey" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "failureReason" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_tenantId_idempotencyKey_key"
  ON "Notification"("tenantId", "idempotencyKey");
CREATE INDEX "Notification_tenantId_status_idx" ON "Notification"("tenantId", "status");
CREATE INDEX "Notification_tenantId_customerId_createdAt_idx"
  ON "Notification"("tenantId", "customerId", "createdAt");
CREATE INDEX "Notification_tenantId_channel_idx" ON "Notification"("tenantId", "channel");
CREATE INDEX "Notification_tenantId_type_idx" ON "Notification"("tenantId", "type");
CREATE INDEX "Notification_tenantId_scheduledAt_idx" ON "Notification"("tenantId", "scheduledAt");
CREATE INDEX "Notification_providerMessageId_idx" ON "Notification"("providerMessageId");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
