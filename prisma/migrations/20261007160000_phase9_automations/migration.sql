-- Phase 9: automation engine

CREATE TYPE "AutomationStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "AutomationRunStatus_new" AS ENUM (
  'QUEUED', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'
);
CREATE TYPE "AutomationStepRunStatus" AS ENUM (
  'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'
);

ALTER TABLE "Automation" ADD COLUMN IF NOT EXISTS "triggerType" TEXT;
ALTER TABLE "Automation" ADD COLUMN IF NOT EXISTS "triggerConfig" JSONB;
ALTER TABLE "Automation" ADD COLUMN IF NOT EXISTS "activeVersionId" TEXT;
ALTER TABLE "Automation" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Automation" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;

UPDATE "Automation" SET "triggerType" = UPPER(REPLACE("trigger", '.', '_'))
WHERE "triggerType" IS NULL;

ALTER TABLE "Automation" ALTER COLUMN "triggerType" SET NOT NULL;

ALTER TABLE "Automation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Automation"
  ALTER COLUMN "status" TYPE "AutomationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'ENABLED' THEN 'ACTIVE'
      WHEN 'DISABLED' THEN 'PAUSED'
      WHEN 'DRAFT' THEN 'DRAFT'
      ELSE 'DRAFT'
    END::"AutomationStatus_new"
  );
DROP TYPE "AutomationStatus";
ALTER TYPE "AutomationStatus_new" RENAME TO "AutomationStatus";
ALTER TABLE "Automation" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE TABLE "AutomationVersion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "definition" JSONB NOT NULL,
  "triggerType" TEXT NOT NULL,
  "triggerConfig" JSONB,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "AutomationVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationVersion_automationId_version_key" ON "AutomationVersion"("automationId", "version");
CREATE INDEX "AutomationVersion_tenantId_idx" ON "AutomationVersion"("tenantId");
CREATE INDEX "AutomationVersion_tenantId_triggerType_idx" ON "AutomationVersion"("tenantId", "triggerType");

ALTER TABLE "AutomationVersion"
  ADD CONSTRAINT "AutomationVersion_automationId_fkey"
  FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AutomationVersion" (
  "id", "tenantId", "automationId", "version", "definition", "triggerType", "createdAt", "publishedAt"
)
SELECT
  'av_' || substr(md5("Automation"."id" || ':1'), 1, 24),
  "tenantId",
  "id",
  1,
  "definition",
  COALESCE("triggerType", UPPER(REPLACE("trigger", '.', '_'))),
  "createdAt",
  CASE WHEN "status"::text IN ('ENABLED', 'ACTIVE') THEN "updatedAt" ELSE NULL END
FROM "Automation"
WHERE NOT EXISTS (
  SELECT 1 FROM "AutomationVersion" av WHERE av."automationId" = "Automation"."id"
);

UPDATE "Automation" a
SET "activeVersionId" = av."id"
FROM "AutomationVersion" av
WHERE av."automationId" = a."id" AND av."version" = 1 AND a."activeVersionId" IS NULL;

ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "automationVersionId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "triggerEventId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "currentStepId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "contextSnapshot" JSONB;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "errorCode" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "causationId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);

UPDATE "AutomationRun" SET "triggerEventId" = "id" WHERE "triggerEventId" IS NULL;
UPDATE "AutomationRun" ar
SET "automationVersionId" = av."id"
FROM "AutomationVersion" av
WHERE av."automationId" = ar."automationId" AND av."version" = 1
  AND ar."automationVersionId" IS NULL;

ALTER TABLE "AutomationRun" ALTER COLUMN "triggerEventId" SET NOT NULL;

ALTER TABLE "AutomationRun" ALTER COLUMN "automationVersionId" SET NOT NULL;

ALTER TABLE "AutomationRun" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AutomationRun"
  ALTER COLUMN "status" TYPE "AutomationRunStatus_new"
  USING (
    CASE "status"::text
      WHEN 'SUCCESS' THEN 'COMPLETED'
      WHEN 'FAILURE' THEN 'FAILED'
      WHEN 'RUNNING' THEN 'RUNNING'
      ELSE 'QUEUED'
    END::"AutomationRunStatus_new"
  );
DROP TYPE "AutomationRunStatus";
ALTER TYPE "AutomationRunStatus_new" RENAME TO "AutomationRunStatus";
ALTER TABLE "AutomationRun" ALTER COLUMN "status" SET DEFAULT 'QUEUED';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AutomationRun' AND column_name = 'finishedAt'
  ) THEN
    ALTER TABLE "AutomationRun" RENAME COLUMN "finishedAt" TO "completedAt";
  END IF;
END $$;

CREATE TABLE "AutomationStepRun" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "automationRunId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "stepType" TEXT NOT NULL,
  "status" "AutomationStepRunStatus" NOT NULL DEFAULT 'PENDING',
  "input" JSONB,
  "output" JSONB,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  CONSTRAINT "AutomationStepRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutomationStepRun_tenantId_idx" ON "AutomationStepRun"("tenantId");
CREATE INDEX "AutomationStepRun_automationRunId_stepId_idx" ON "AutomationStepRun"("automationRunId", "stepId");

ALTER TABLE "AutomationStepRun"
  ADD CONSTRAINT "AutomationStepRun_automationRunId_fkey"
  FOREIGN KEY ("automationRunId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InternalNotification" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalNotification_tenantId_userId_createdAt_idx"
  ON "InternalNotification"("tenantId", "userId", "createdAt");

CREATE TABLE "CustomerTag" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerTag_tenantId_slug_key" ON "CustomerTag"("tenantId", "slug");
CREATE INDEX "CustomerTag_tenantId_idx" ON "CustomerTag"("tenantId");

CREATE TABLE "CustomerTagAssignment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerTagAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerTagAssignment_tenantId_customerId_tagId_key"
  ON "CustomerTagAssignment"("tenantId", "customerId", "tagId");
CREATE INDEX "CustomerTagAssignment_tenantId_customerId_idx"
  ON "CustomerTagAssignment"("tenantId", "customerId");

ALTER TABLE "CustomerTagAssignment"
  ADD CONSTRAINT "CustomerTagAssignment_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerTagAssignment"
  ADD CONSTRAINT "CustomerTagAssignment_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "CustomerTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Automation_activeVersionId_key" ON "Automation"("activeVersionId");
CREATE UNIQUE INDEX "AutomationRun_dedupe_key"
  ON "AutomationRun"("tenantId", "automationId", "automationVersionId", "triggerEventId");
CREATE INDEX "Automation_tenantId_triggerType_status_idx"
  ON "Automation"("tenantId", "triggerType", "status");
CREATE INDEX "AutomationRun_tenantId_status_startedAt_idx"
  ON "AutomationRun"("tenantId", "status", "startedAt");

ALTER TABLE "Automation"
  ADD CONSTRAINT "Automation_activeVersionId_fkey"
  FOREIGN KEY ("activeVersionId") REFERENCES "AutomationVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationRun"
  ADD CONSTRAINT "AutomationRun_automationVersionId_fkey"
  FOREIGN KEY ("automationVersionId") REFERENCES "AutomationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
