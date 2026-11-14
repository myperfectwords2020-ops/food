import type { CartLineInput } from "@/types/commerce";

import { cartLinesKey } from "@/lib/query/query-utils";

export const cartKeys = {
  all: ["cart"] as const,
  bootstrap: () => [...cartKeys.all, "bootstrap"] as const,
  server: () => [...cartKeys.all, "server"] as const,
  guestLines: () => [...cartKeys.all, "guest-lines"] as const,
  guestSummary: (linesKey: string) => [...cartKeys.all, "guest-summary", linesKey] as const,
  guestSummaryFromLines: (lines: CartLineInput[]) => cartKeys.guestSummary(cartLinesKey(lines)),
};

export const checkoutKeys = {
  all: ["checkout"] as const,
  summary: (stateCode: string, linesKey: string) =>
    [...checkoutKeys.all, "summary", stateCode, linesKey] as const,
  summaryFromLines: (stateCode: string, lines: CartLineInput[]) =>
    checkoutKeys.summary(stateCode, cartLinesKey(lines)),
};

export const adminKeys = {
  all: ["admin"] as const,
  orders: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "orders", filters] as const,
  products: (filters: Record<string, string | undefined>) =>
    [...adminKeys.all, "products", filters] as const,
  customers: (filters: Record<string, string | undefined>) =>
    [...adminKeys.all, "customers", filters] as const,
  inventory: () => [...adminKeys.all, "inventory"] as const,
  deliveryRates: () => [...adminKeys.all, "delivery-rates"] as const,
  dashboard: (range: string) => [...adminKeys.all, "dashboard", range] as const,
  analytics: (range: string) => [...adminKeys.all, "analytics", range] as const,
  leads: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "leads", filters] as const,
  leadDetail: (id: string) => [...adminKeys.all, "lead", id] as const,
};

export const leadKeys = {
  all: ["leads"] as const,
  list: (filters: Record<string, string | number | undefined>) =>
    [...leadKeys.all, "list", filters] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};

/** @deprecated Prefer cartKeys / checkoutKeys / adminKeys factories. */
export const queryKeys = {
  cart: {
    bootstrap: cartKeys.bootstrap(),
    server: cartKeys.server(),
    guestSummary: (linesKey: string) => cartKeys.guestSummary(linesKey),
  },
  checkout: {
    summary: (stateCode: string, linesKey: string) => checkoutKeys.summary(stateCode, linesKey),
  },
  admin: {
    orders: (filters: Record<string, string | number | undefined>) => adminKeys.orders(filters),
    products: (filters: Record<string, string | undefined>) => adminKeys.products(filters),
    customers: (filters: Record<string, string | undefined>) => adminKeys.customers(filters),
    inventory: adminKeys.inventory(),
    deliveryRates: adminKeys.deliveryRates(),
    dashboard: (range: string) => adminKeys.dashboard(range),
    analytics: (range: string) => adminKeys.analytics(range),
    leads: (filters: Record<string, string | undefined>) => adminKeys.leads(filters),
  },
};

export { cartLinesKey };
