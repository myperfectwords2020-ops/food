import { fromMinorUnits } from "@/lib/money";
import type { Order as CommerceOrder, OrderStatus } from "@/types/commerce";

type DbOrder = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotalMinor: number;
  deliveryMinor: number;
  discountMinor: number;
  totalMinor: number;
  customerEmail: string;
  customerPhone: string | null;
  customerName: string | null;
  shippingLine1: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  createdAt: Date;
  items: {
    productId: string | null;
    productName: string;
    productSlug: string | null;
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
  }[];
  payments: { status: string }[];
};

function mapStatus(status: string): OrderStatus {
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
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    case "FAILED":
      return "cancelled";
    default:
      return "processing";
  }
}

function primaryPayment(payments: DbOrder["payments"]) {
  if (payments.length === 0) return undefined;
  return payments.find((p) => p.status === "SUCCEEDED") ?? payments[0];
}

export function toCommerceOrder(order: DbOrder): CommerceOrder {
  const payment = primaryPayment(order.payments);
  const lines = order.items.map((line) => ({
    productId: line.productId ?? line.productName,
    quantity: line.quantity,
    name: line.productName,
    slug: line.productSlug ?? "",
    image: "",
    unitPrice: fromMinorUnits(line.unitPriceMinor, order.currency),
    lineTotal: fromMinorUnits(line.lineTotalMinor, order.currency),
    maxQuantity: line.quantity,
  }));

  const summary = {
    lines,
    subtotal: fromMinorUnits(order.subtotalMinor, order.currency),
    delivery: order.deliveryMinor ? fromMinorUnits(order.deliveryMinor, order.currency) : null,
    discount: fromMinorUnits(order.discountMinor, order.currency),
    total: fromMinorUnits(order.totalMinor, order.currency),
    currency: "NGN" as const,
  };

  const [firstName = "", lastName = ""] = (order.customerName ?? "").split(" ");

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: mapStatus(order.status),
    paymentStatus: payment?.status === "SUCCEEDED" ? "paid" : "pending",
    customer: {
      email: order.customerEmail,
      phone: order.customerPhone ?? "",
      firstName,
      lastName,
    },
    address: {
      street: order.shippingLine1 ?? "",
      city: order.shippingCity ?? "",
      state: order.shippingState ?? "",
    },
    lines,
    summary,
    deliveryEstimate: "2–4 business days after payment confirmation",
  };
}

export function orderInternalId(order: DbOrder) {
  return order.id;
}
