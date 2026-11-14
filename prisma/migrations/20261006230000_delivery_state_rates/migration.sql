CREATE TABLE IF NOT EXISTS "DeliveryStateRate" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "stateCode" TEXT NOT NULL,
  "stateName" TEXT NOT NULL,
  "deliveryMinor" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DeliveryStateRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryStateRate_tenantId_stateCode_key"
  ON "DeliveryStateRate"("tenantId", "stateCode");
CREATE INDEX IF NOT EXISTS "DeliveryStateRate_tenantId_idx"
  ON "DeliveryStateRate"("tenantId");

ALTER TABLE "DeliveryStateRate"
  ADD CONSTRAINT "DeliveryStateRate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
