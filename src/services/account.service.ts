import { customers, orders as legacyOrders } from "@/lib/skincare-data";
import type {
  AccountAddress,
  AccountOrderSummary,
  AccountPreferences,
  AccountProfile,
  OrderStatus,
} from "@/types/commerce";

import { mockOrderService } from "./order.service";

export interface AccountService {
  getProfile(): Promise<AccountProfile>;
  getAddresses(): Promise<AccountAddress[]>;
  getPreferences(): Promise<AccountPreferences>;
  getRecommendations(): Promise<string[]>;
  listOrderSummaries(): Promise<AccountOrderSummary[]>;
}

const profile: AccountProfile = {
  firstName: "Amara",
  lastName: "Okoye",
  email: customers[0]?.email ?? "amara@example.com",
  phone: customers[0]?.phone ?? "+234 803 555 0148",
};

const addresses: AccountAddress[] = [
  {
    id: "addr-1",
    label: "Home",
    street: "14 Adeola Odeku Street",
    city: "Victoria Island",
    state: "Lagos",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Office",
    street: "22 Bourdillon Road",
    city: "Ikoyi",
    state: "Lagos",
    isDefault: false,
  },
];

const preferences: AccountPreferences = {
  emailOffers: true,
  smsUpdates: true,
  whatsappOffers: false,
  fragranceFree: false,
  routineReminders: true,
};

function mapLegacyStatus(status: string): OrderStatus {
  if (status === "Delivered") return "delivered";
  if (status === "Shipped") return "shipped";
  if (status === "Awaiting") return "pending_payment";
  return "processing";
}

export const mockAccountService: AccountService = {
  async getProfile() {
    return profile;
  },
  async getAddresses() {
    return addresses;
  },
  async getPreferences() {
    return preferences;
  },
  async getRecommendations() {
    return ["Cloudveil Barrier Moisturizer", "Daylight Vitamin C Serum", "Sunroom Daily SPF 50"];
  },
  async listOrderSummaries() {
    const dynamic = await mockOrderService.listOrdersForAccount();
    const dynamicSummaries: AccountOrderSummary[] = dynamic.map((o) => ({
      id: o.id,
      date: new Date(o.createdAt).toLocaleDateString("en-NG"),
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: o.summary.total,
      itemCount: o.lines.reduce((s, l) => s + l.quantity, 0),
    }));

    const legacySummaries: AccountOrderSummary[] = legacyOrders.map((o) => ({
      id: o.id,
      date: o.date,
      status: mapLegacyStatus(o.status),
      paymentStatus: o.payment === "Paid" ? "paid" : "pending",
      total: o.amount,
      itemCount: o.items,
    }));

    const seen = new Set<string>();
    return [...dynamicSummaries, ...legacySummaries].filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  },
};
