-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'ROUTINE', 'AI_ASSISTANT', 'CAMPAIGN', 'SOCIAL', 'REFERRAL', 'MANUAL', 'CONTACT_FORM', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'NOTE_ADDED', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST', 'SOURCE_UPDATED', 'SYSTEM_EVENT');

-- AlterTable Lead: add CRM columns
ALTER TABLE "Lead" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "normalizedEmail" TEXT;
ALTER TABLE "Lead" ADD COLUMN "normalizedPhone" TEXT;
ALTER TABLE "Lead" ADD COLUMN "sourceDetail" TEXT;
ALTER TABLE "Lead" ADD COLUMN "status" "LeadStatus" NOT NULL DEFAULT 'NEW';
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "scoreReasons" JSONB;
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmTerm" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "Lead" ADD COLUMN "referrer" TEXT;
ALTER TABLE "Lead" ADD COLUMN "landingPage" TEXT;
ALTER TABLE "Lead" ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN "marketingConsentAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "marketingConsentSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "qualifiedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lostAt" TIMESTAMP(3);

-- Migrate source string -> enum column
ALTER TABLE "Lead" ADD COLUMN "sourceNew" "LeadSource" NOT NULL DEFAULT 'MANUAL';

UPDATE "Lead" SET "sourceNew" = CASE
  WHEN LOWER("source") LIKE '%routine%' THEN 'ROUTINE'::"LeadSource"
  WHEN LOWER("source") LIKE '%ai%' OR LOWER("source") LIKE '%assistant%' THEN 'AI_ASSISTANT'::"LeadSource"
  WHEN LOWER("source") LIKE '%social%' THEN 'SOCIAL'::"LeadSource"
  WHEN LOWER("source") LIKE '%referral%' THEN 'REFERRAL'::"LeadSource"
  WHEN LOWER("source") LIKE '%campaign%' THEN 'CAMPAIGN'::"LeadSource"
  WHEN LOWER("source") LIKE '%contact%' THEN 'CONTACT_FORM'::"LeadSource"
  WHEN LOWER("source") LIKE '%newsletter%' THEN 'NEWSLETTER'::"LeadSource"
  WHEN LOWER("source") LIKE '%website%' OR LOWER("source") LIKE '%web%' THEN 'WEBSITE'::"LeadSource"
  ELSE 'MANUAL'::"LeadSource"
END;

ALTER TABLE "Lead" DROP COLUMN "source";
ALTER TABLE "Lead" RENAME COLUMN "sourceNew" TO "source";

-- Migrate stage -> status
UPDATE "Lead" SET "status" = CASE
  WHEN "stage"::text = 'QUALIFIED' THEN 'QUALIFIED'::"LeadStatus"
  WHEN "stage"::text IN ('CUSTOMER', 'REPEAT_CUSTOMER') THEN 'CONVERTED'::"LeadStatus"
  WHEN "stage"::text = 'VISITOR' THEN 'NEW'::"LeadStatus"
  ELSE 'NEW'::"LeadStatus"
END
WHERE "stage" IS NOT NULL;

UPDATE "Lead" SET "qualifiedAt" = "updatedAt" WHERE "status" = 'QUALIFIED' AND "qualifiedAt" IS NULL;
UPDATE "Lead" SET "convertedAt" = COALESCE("convertedAt", "updatedAt") WHERE "status" = 'CONVERTED';

ALTER TABLE "Lead" DROP COLUMN "stage";

-- Normalize contact fields
UPDATE "Lead" SET "normalizedEmail" = LOWER(TRIM("email")) WHERE "email" IS NOT NULL AND TRIM("email") <> '';
ALTER TABLE "Lead" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable LeadActivity
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "actorUserId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadActivity_tenantId_idx" ON "LeadActivity"("tenantId");
CREATE INDEX "LeadActivity_tenantId_leadId_createdAt_idx" ON "LeadActivity"("tenantId", "leadId", "createdAt");

ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");
CREATE INDEX "Lead_tenantId_normalizedEmail_idx" ON "Lead"("tenantId", "normalizedEmail");
CREATE INDEX "Lead_tenantId_normalizedPhone_idx" ON "Lead"("tenantId", "normalizedPhone");
CREATE INDEX "Lead_tenantId_ownerId_idx" ON "Lead"("tenantId", "ownerId");
CREATE INDEX "Lead_tenantId_customerId_idx" ON "Lead"("tenantId", "customerId");
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

DROP INDEX IF EXISTS "Lead_tenantId_stage_idx";
