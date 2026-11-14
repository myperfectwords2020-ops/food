import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

import type { OrderStatus as CommerceOrderStatus } from "@/types/commerce";

const TO_PRISMA: Record<CommerceOrderStatus, PrismaOrderStatus | null> = {
  pending_payment: "PENDING_PAYMENT",
  paid: "PAID",
  processing: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
};

export function commerceOrderStatusToPrisma(status: CommerceOrderStatus): PrismaOrderStatus {
  const mapped = TO_PRISMA[status];
  if (!mapped) throw new Error(`Unsupported order status: ${status}`);
  return mapped;
}

export function prismaOrderStatusToCommerce(status: string): CommerceOrderStatus {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending_payment";
    case "PAID":
      return "paid";
    case "PROCESSING":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
    case "FAILED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "processing";
  }
}

export const ORDER_STATUS_LABELS: Record<CommerceOrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid — awaiting fulfillment",
  processing: "Preparing order",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Forward fulfillment path after payment (Prisma enum). */
export const FULFILLMENT_STATUS_PIPELINE = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const satisfies readonly PrismaOrderStatus[];