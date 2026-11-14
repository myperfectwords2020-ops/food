-- Analytics events for product engagement and assistant attribution

CREATE TYPE "AnalyticsEventType" AS ENUM (
  'PRODUCT_VIEW',
  'STOREFRONT_ADD_TO_CART',
  'ASSISTANT_ADD_TO_CART',
  'ASSISTANT_RECOMMENDATION_CLICK',
  'ASSISTANT_ORDER_ATTRIBUTED'
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "productId" TEXT,
  "customerId" TEXT,
  "sessionKey" TEXT,
  "conversationId" TEXT,
  "orderId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_tenantId_eventType_createdAt_idx"
  ON "AnalyticsEvent"("tenantId", "eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_tenantId_productId_createdAt_idx"
  ON "AnalyticsEvent"("tenantId", "productId", "createdAt");
CREATE INDEX "AnalyticsEvent_tenantId_customerId_createdAt_idx"
  ON "AnalyticsEvent"("tenantId", "customerId", "createdAt");
CREATE INDEX "AnalyticsEvent_tenantId_orderId_idx"
  ON "AnalyticsEvent"("tenantId", "orderId");
