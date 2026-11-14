import { fromMinorUnits } from "@/lib/money";
import { requireCustomerRequestContext } from "@/lib/auth/request-context";
import {
  getCustomerForUser,
  getAddressForCustomer,
} from "@/modules/customers/customer-access.service";
import { listCustomerRecommendations } from "@/modules/customers/customer-recommendation.service";
import { getCustomerOrderById, listOrdersForCustomer } from "@/modules/orders/order-access.service";
import type {
  AccountAddress,
  AccountOrderSummary,
  AccountPreferences,
  AccountProfile,
  AccountRecommendationSet,
} from "@/types/commerce";

function mapOrderStatus(status: string): AccountOrderSummary["status"] {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending_payment";
    case "PAID":
      return "processing";
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
    default:
      return "processing";
  }
}

function mapAddress(row: {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  street: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}): AccountAddress {
  return {
    id: row.id,
    label: row.label ?? "Address",
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    phone: row.phone ?? "",
    street: row.street,
    line2: row.line2 ?? "",
    city: row.city,
    state: row.state,
    postalCode: row.postalCode ?? "",
    country: row.country,
    isDefault: row.isDefault,
  };
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const ctx = await requireCustomerRequestContext();
  const customer = await getCustomerForUser(ctx);
  return {
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    email: customer.email,
    phone: customer.phone ?? "",
  };
}

export async function getAccountAddresses(): Promise<AccountAddress[]> {
  const ctx = await requireCustomerRequestContext();
  const customer = await getCustomerForUser(ctx);
  return customer.addresses.map(mapAddress);
}

export async function getAccountPreferences(): Promise<AccountPreferences> {
  const ctx = await requireCustomerRequestContext();
  const customer = await getCustomerForUser(ctx);
  const prefs = customer.preferences;
  return {
    emailOffers: prefs?.emailOffers ?? false,
    smsUpdates: prefs?.smsUpdates ?? false,
    whatsappOffers: prefs?.whatsappOffers ?? false,
    fragranceFree: prefs?.fragranceFree ?? false,
    routineReminders: prefs?.routineReminders ?? true,
    communicationChannel:
      (prefs?.communicationChannel as AccountPreferences["communicationChannel"]) ?? "email",
  };
}

export async function getAccountRecommendationSets(): Promise<AccountRecommendationSet[]> {
  const ctx = await requireCustomerRequestContext();
  const rows = await listCustomerRecommendations(ctx, 10);
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    products: r.products,
  }));
}

/** Latest recommendation product names (dashboard). */
export async function getAccountRecommendations(): Promise<string[]> {
  const sets = await getAccountRecommendationSets();
  const latest = sets[0];
  if (!latest) return [];
  return latest.products.map((p) => p.name);
}

export async function listAccountOrderSummaries(): Promise<AccountOrderSummary[]> {
  const ctx = await requireCustomerRequestContext();
  const orders = await listOrdersForCustomer(ctx);
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    date: o.createdAt.toLocaleDateString("en-NG"),
    status: mapOrderStatus(o.status),
    paymentStatus: o.payments[0]?.status === "SUCCEEDED" ? "paid" : "pending",
    total: fromMinorUnits(o.totalMinor, o.currency),
    itemCount: o.items.reduce((s, item) => s + item.quantity, 0),
  }));
}

export async function getAccountOrder(orderId: string) {
  const ctx = await requireCustomerRequestContext();
  const order = await getCustomerOrderById(ctx, orderId);
  const payment = order.payments[0];
  const address = order.address;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: mapOrderStatus(order.status),
    paymentStatus: payment?.status === "SUCCEEDED" ? ("paid" as const) : ("pending" as const),
    lines: order.items.map((line) => ({
      productId: line.productId ?? line.id,
      name: line.productName,
      quantity: line.quantity,
      lineTotal: fromMinorUnits(line.lineTotalMinor, order.currency),
    })),
    summary: {
      subtotal: fromMinorUnits(order.subtotalMinor, order.currency),
      delivery: fromMinorUnits(order.deliveryMinor, order.currency),
      discount: fromMinorUnits(order.discountMinor, order.currency),
      total: fromMinorUnits(order.totalMinor, order.currency),
    },
    address: address
      ? {
          street: address.street,
          city: address.city,
          state: address.state,
        }
      : { street: "", city: "", state: "" },
    deliveryEstimate: "Delivery details will appear when your order ships.",
  };
}

export async function getAccountAddressById(addressId: string) {
  const ctx = await requireCustomerRequestContext();
  const row = await getAddressForCustomer(ctx, addressId);
  return mapAddress(row);
}
