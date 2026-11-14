"use server";

import { headers } from "next/headers";

import { requireCustomerRequestContext } from "@/lib/auth/request-context";
import { normalizeError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  initializePaymentForOrder,
  verifyPaymentForCustomer,
} from "@/modules/payments/payment-application.service";

export async function initializePaymentAction(orderId: string): Promise<
  | {
      ok: true;
      authorizationUrl: string;
      reference: string;
      amountMinor: number;
      currency: string;
    }
  | { ok: false; error: string }
> {
  try {
    const ctx = await requireCustomerRequestContext();
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await rateLimit(`pay-init:${ip}:${ctx.userId}`, 20, 900);
    if (!allowed) {
      return { ok: false, error: "Too many payment attempts. Try again later." };
    }

    const result = await initializePaymentForOrder(ctx, orderId);
    return { ok: true, ...result };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false, error: e.expose ? e.message : "Could not start payment." };
  }
}

export async function verifyPaymentAction(
  orderId: string,
  reference?: string | undefined,
): Promise<
  | { ok: true; paymentStatus: "paid" | "pending" | "failed"; orderStatus: string }
  | { ok: false; error: string }
> {
  try {
    const ctx = await requireCustomerRequestContext();
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await rateLimit(`pay-verify:${ip}:${ctx.userId}`, 30, 900);
    if (!allowed) {
      return { ok: false, error: "Too many verification attempts. Try again later." };
    }

    const outcome = await verifyPaymentForCustomer(ctx, orderId, reference);
    return {
      ok: true,
      paymentStatus: outcome.paymentStatus,
      orderStatus: outcome.orderStatus,
    };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false, error: e.expose ? e.message : "Payment verification failed." };
  }
}
