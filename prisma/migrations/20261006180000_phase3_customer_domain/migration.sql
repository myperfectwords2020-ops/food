-- AlterTable Address
ALTER TABLE "Address" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Address" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Address" ADD COLUMN "phone" TEXT;
ALTER TABLE "Address" ADD COLUMN "line2" TEXT;
ALTER TABLE "Address" ADD COLUMN "postalCode" TEXT;

-- AlterTable CustomerPreference
ALTER TABLE "CustomerPreference" ADD COLUMN "whatsappOffers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomerPreference" ADD COLUMN "emailOffersConsentAt" TIMESTAMP(3);
ALTER TABLE "CustomerPreference" ADD COLUMN "whatsappOffersConsentAt" TIMESTAMP(3);
ALTER TABLE "CustomerPreference" ADD COLUMN "marketingConsentVersion" TEXT;
ALTER TABLE "CustomerPreference" ADD COLUMN "communicationChannel" TEXT;
ALTER TABLE "CustomerPreference" ALTER COLUMN "emailOffers" SET DEFAULT false;

-- CreateTable EmailChangeToken
CREATE TABLE "EmailChangeToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailChangeToken_userId_idx" ON "EmailChangeToken"("userId");
CREATE INDEX "EmailChangeToken_expiresAt_idx" ON "EmailChangeToken"("expiresAt");

ALTER TABLE "EmailChangeToken" ADD CONSTRAINT "EmailChangeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
