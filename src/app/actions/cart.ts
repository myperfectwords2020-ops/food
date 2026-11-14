"use server";

import { cookies } from "next/headers";

import { getRequestContext, requireCustomerRequestContext } from "@/lib/auth/request-context";
import { normalizeError } from "@/lib/errors/app-error";
import {
  getCustomerCartSnapshot,
  mergeGuestLinesIntoCustomerCart,
  setCartItemQuantity,
} from "@/modules/cart/cart.service";
import { GUEST_CART_COOKIE } from "@/modules/commerce/commerce.constants";
import type { CartLineInput, CartSummary } from "@/types/commerce";

export async function fetchCustomerCartAction(): Promise<{
  lines: CartLineInput[];
  summary: CartSummary;
} | null> {
  const ctx = await getRequestContext();
  if (!ctx || ctx.role !== "CUSTOMER" || !ctx.customerId) return null;
  try {
    const customerCtx = ctx as typeof ctx & { customerId: string };
    return getCustomerCartSnapshot(customerCtx);
  } catch {
    return null;
  }
}

export async function syncCartItemAction(productId: string, quantity: number) {
  try {
    const ctx = await requireCustomerRequestContext();
    const summary = await setCartItemQuantity(ctx, productId, quantity);
    return { ok: true as const, summary };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not update cart." };
  }
}

export async function mergeLocalCartAction(localLines: CartLineInput[]) {
  try {
    const ctx = await requireCustomerRequestContext();
    await mergeGuestLinesIntoCustomerCart(ctx, localLines);
    const cookieStore = await cookies();
    cookieStore.delete(GUEST_CART_COOKIE);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
