-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKOUT', 'CONVERTED', 'ABANDONED', 'EXPIRED');
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONVERTED');
ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';

-- AlterTable Cart
ALTER TABLE "Cart" ADD COLUMN "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Cart" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
CREATE INDEX "Cart_tenantId_status_idx" ON "Cart"("tenantId", "status");

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "taxMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingFirstName" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLastName" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLine1" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLine2" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingState" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingPostalCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCountry" TEXT;
CREATE INDEX "Order_tenantId_customerId_idx" ON "Order"("tenantId", "customerId");

UPDATE "Order" SET "orderNumber" = 'ELN-LEGACY-' || "id" WHERE "orderNumber" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "productSku" TEXT;

-- CreateTable InventoryReservation
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryReservation_tenantId_status_expiresAt_idx" ON "InventoryReservation"("tenantId", "status", "expiresAt");
CREATE INDEX "InventoryReservation_orderId_idx" ON "InventoryReservation"("orderId");
CREATE INDEX "InventoryReservation_productId_idx" ON "InventoryReservation"("productId");

ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
