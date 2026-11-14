/** Per-resource stale times (ms) — override global defaults in hooks. */
export const staleTimes = {
  catalog: 5 * 60_000,
  productDetail: 5 * 60_000,
  customerProfile: 60_000,
  orders: 30_000,
  inventory: 15_000,
  cart: 0,
  checkout: 0,
  payment: 0,
  adminList: 120_000,
  adminDashboard: 120_000,
  conversations: 10_000,
} as const;
