"use client";

import type { ReactNode } from "react";

export { useCart } from "@/modules/cart/queries/use-cart";

/** @deprecated Cart state lives in TanStack Query; provider is a no-op for backwards compatibility. */
export function CartProvider({ children }: { children: ReactNode }) {
  return children;
}
