-- Phase 5: Paystack payments
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerTransactionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_tenantId_providerReference_key"
  ON "Payment"("tenantId", "providerReference");

CREATE TABLE IF NOT EXISTS "DomainEventOutbox" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispatchedAt" TIMESTAMP(3),
  CONSTRAINT "DomainEventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DomainEventOutbox_tenantId_createdAt_idx"
  ON "DomainEventOutbox"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "DomainEventOutbox_dispatchedAt_idx"
  ON "DomainEventOutbox"("dispatchedAt");
