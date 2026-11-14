-- Phase 8: conversation support workflow

CREATE TYPE "ConversationStatus_new" AS ENUM (
  'ACTIVE',
  'HANDOFF_REQUESTED',
  'HUMAN_ASSIGNED',
  'RESOLVED',
  'CLOSED'
);

ALTER TABLE "Conversation" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Conversation"
  ALTER COLUMN "status" TYPE "ConversationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'ACTIVE'
      WHEN 'WAITING' THEN 'HANDOFF_REQUESTED'
      WHEN 'HANDOFF' THEN 'HANDOFF_REQUESTED'
      WHEN 'CLOSED' THEN 'CLOSED'
      ELSE 'ACTIVE'
    END::"ConversationStatus_new"
  );

DROP TYPE "ConversationStatus";
ALTER TYPE "ConversationStatus_new" RENAME TO "ConversationStatus";

ALTER TABLE "Conversation" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TYPE "MessageRole" ADD VALUE IF NOT EXISTS 'INTERNAL_NOTE';
ALTER TYPE "MessageRole" ADD VALUE IF NOT EXISTS 'TOOL';

ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "handoffTo";

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "handoffRequestedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastCustomerMessageAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastStaffMessageAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unreadCustomerCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unreadStaffCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderUserId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderCustomerId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Conversation_tenantId_assignedToUserId_idx" ON "Conversation"("tenantId", "assignedToUserId");
CREATE INDEX IF NOT EXISTS "Conversation_tenantId_customerId_idx" ON "Conversation"("tenantId", "customerId");
CREATE INDEX IF NOT EXISTS "Conversation_tenantId_status_lastMessageAt_idx" ON "Conversation"("tenantId", "status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_id_idx" ON "Message"("conversationId", "createdAt", "id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_assignedToUserId_fkey'
  ) THEN
    ALTER TABLE "Conversation"
      ADD CONSTRAINT "Conversation_assignedToUserId_fkey"
      FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "Conversation"
SET "handoffRequestedAt" = "updatedAt"
WHERE "status" = 'HANDOFF_REQUESTED' AND "handoffRequestedAt" IS NULL;
