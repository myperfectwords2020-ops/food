"use server";

import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";

import { requireCustomerRequestContext } from "@/lib/auth/request-context";
import { normalizeError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  getCustomerCartSnapshot,
  getCustomerCartSummary,
  loadProductsForPricing,
  mergeGuestLinesIntoCustomerCart,
} from "@/modules/cart/cart.service";
import { z } from "zod";
import { resolveDeliveryMinorForState } from "@/modules/commerce/delivery-rate.service";
import { ORDER_ACCESS_COOKIE } from "@/modules/commerce/commerce.constants";
import { createOrderFromCheckout } from "@/modules/orders/checkout.service";
import { getOrderForCustomerAccess } from "@/modules/orders/admin-order.service";
import { checkoutSchema } from "@/lib/validations/checkout";
import type { CartSummary } from "@/types/commerce";

const checkoutCartLinesSchema = z.array(
  z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99),
  }),
);

export async function getCartSummaryAction(): Promise<CartSummary> {
  const ctx = await requireCustomerRequestContext();
  return getCustomerCartSummary(ctx);
}

const emptyCartSummary: CartSummary = {
  lines: [],
  subtotal: 0,
  delivery: null,
  discount: 0,
  total: 0,
  currency: "NGN",
};

async function buildCheckoutSummary(
  tenantId: string,
  lines: { productId: string; quantity: number }[],
  shippingStateCode?: string,
): Promise<CartSummary> {
  if (lines.length === 0) return emptyCartSummary;

  const products = await loadProductsForPricing(
    tenantId,
    lines.map((l) => l.productId),
  );
  const { priceCartLines, breakdownToCartSummary } =
    await import("@/modules/commerce/pricing.service");

  let deliveryMinor: number | undefined;
  if (shippingStateCode) {
    const resolved = await resolveDeliveryMinorForState(tenantId, shippingStateCode);
    deliveryMinor = resolved.deliveryMinor;
  }

  const { breakdown } = priceCartLines(lines, products, {
    includeDelivery: Boolean(shippingStateCode),
    ...(deliveryMinor !== undefined ? { deliveryMinor } : {}),
  });
  return breakdownToCartSummary(breakdown);
}

/** Checkout sidebar must price the same cart lines the customer sees in the UI. */
export async function getCheckoutSummaryFromLinesAction(
  lines: { productId: string; quantity: number }[],
  shippingStateCode?: string,
): Promise<CartSummary> {
  const ctx = await requireCustomerRequestContext();
  return buildCheckoutSummary(ctx.tenantId!, lines, shippingStateCode);
}

export async function getCheckoutSummaryAction(
  shippingStateCode?: string | undefined,
): Promise<CartSummary> {
  const ctx = await requireCustomerRequestContext();
  const { lines } = await getCustomerCartSnapshot(ctx);
  return buildCheckoutSummary(ctx.tenantId!, lines, shippingStateCode);
}

export async function getCartSummaryFromLinesAction(
  lines: { productId: string; quantity: number }[],
): Promise<CartSummary> {
  if (lines.length === 0) {
    return {
      lines: [],
      subtotal: 0,
      delivery: null,
      discount: 0,
      total: 0,
      currency: "NGN",
    };
  }

  const { resolvePublicTenantId } = await import("@/lib/tenants/public-tenant");
  const tenantId = await resolvePublicTenantId();
  const products = await loadProductsForPricing(
    tenantId,
    lines.map((l) => l.productId),
  );
  const { priceCartLines, breakdownToCartSummary } =
    await import("@/modules/commerce/pricing.service");
  const { breakdown } = priceCartLines(lines, products, { includeDelivery: false });
  return breakdownToCartSummary(breakdown);
}

export async function submitCheckoutAction(
  _lines: unknown,
  raw: unknown,
  idempotencyKey?: string | undefined,
): Promise<
  | { ok: true; orderId: string; summary: CartSummary; paystackPublicKey: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const ctx = await requireCustomerRequestContext();
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await rateLimit(`checkout:${ip}:${ctx.userId}`, 10, 900);
    if (!allowed) {
      return { ok: false, error: "Too many checkout attempts. Try again later." };
    }

    const clientLines = checkoutCartLinesSchema.safeParse(_lines);
    if (clientLines.success && clientLines.data.length > 0) {
      const { lines: serverLines } = await getCustomerCartSnapshot(ctx);
      if (serverLines.length === 0) {
        await mergeGuestLinesIntoCustomerCart(ctx, clientLines.data);
      }
    }

    const key = idempotencyKey ?? randomUUID();
    const result = await createOrderFromCheckout(ctx, parsed.data, key);

    const cookieStore = await cookies();
    cookieStore.set(ORDER_ACCESS_COOKIE, result.orderId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const paystackPublicKey = process.env["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] ?? null;

    return {
      ok: true,
      orderId: result.orderId,
      summary: result.summary,
      paystackPublicKey,
    };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false, error: e.expose ? e.message : "Checkout failed. Please try again." };
  }
}

export async function getOrderForConfirmation(orderId: string) {
  const ctx = await requireCustomerRequestContext();
  return getOrderForCustomerAccess(ctx, orderId);
}

export async function clearCartAfterOrderAction() {
  return { ok: true as const };
}
