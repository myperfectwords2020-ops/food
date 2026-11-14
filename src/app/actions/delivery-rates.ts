"use server";

import { requireRequestContext } from "@/lib/auth/request-context";
import { normalizeError } from "@/lib/errors/app-error";
import {
  listDeliveryRatesForAdmin,
  updateDeliveryRatesForAdmin,
} from "@/modules/commerce/delivery-rate.service";

export async function listDeliveryRatesAction() {
  const ctx = await requireRequestContext();
  return listDeliveryRatesForAdmin(ctx);
}

export async function saveDeliveryRatesAction(
  updates: { stateCode: string; deliveryMinor: number; enabled: boolean }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRequestContext();
    await updateDeliveryRatesForAdmin(ctx, updates);
    return { ok: true };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false, error: e.expose ? e.message : "Could not save delivery rates." };
  }
}
