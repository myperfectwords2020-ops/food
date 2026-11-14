"use client";

import { useCart } from "@/components/cart/cart-context";

export function CartBadge() {
  const { itemCount } = useCart({ includeSummary: false });
  if (itemCount <= 0) return null;
  return <span aria-live="polite">{itemCount}</span>;
}
