"use server";

import { headers } from "next/headers";

import { requireCustomerRequestContext } from "@/lib/auth/request-context";
import { AppError, normalizeError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/security/rate-limit";
import { changePasswordForUser, deactivateCustomerAccount } from "@/modules/auth/auth.service";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/modules/customers/address.service";
import type { AddressInput } from "@/modules/customers/customer.validation";
import { updateCustomerPreferences } from "@/modules/customers/customer-preference.service";
import {
  requestCustomerEmailChange,
  updateCustomerProfile,
} from "@/modules/customers/customer-profile.service";
import { deleteCustomerRecommendation } from "@/modules/customers/customer-recommendation.service";
import { changePasswordSchema } from "@/modules/customers/customer.validation";

async function customerMutationRateLimit(userId: string, action: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await rateLimit(`account:${action}:${ip}:${userId}`, 30, 900);
  return allowed;
}

export async function updateAccountProfileAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  try {
    const ctx = await requireCustomerRequestContext();
    if (!(await customerMutationRateLimit(ctx.userId, "profile"))) {
      return { ok: false as const, error: "Too many updates. Try again later." };
    }
    const profile = await updateCustomerProfile(ctx, input);
    return { ok: true as const, profile };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not update profile." };
  }
}

export async function requestAccountEmailChangeAction(newEmail: string) {
  try {
    const ctx = await requireCustomerRequestContext();
    if (!(await customerMutationRateLimit(ctx.userId, "email"))) {
      return { ok: false as const, error: "Too many requests. Try again later." };
    }
    return await requestCustomerEmailChange(ctx, { newEmail });
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not request email change." };
  }
}

export async function changeAccountPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const ctx = await requireCustomerRequestContext();
    if (!(await customerMutationRateLimit(ctx.userId, "password"))) {
      return { ok: false as const, error: "Too many attempts. Try again later." };
    }
    const parsed = changePasswordSchema.parse(input);
    await changePasswordForUser({
      userId: ctx.userId,
      tenantId: ctx.tenantId!,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });
    return { ok: true as const };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not change password." };
  }
}

export async function deactivateAccountAction() {
  try {
    const ctx = await requireCustomerRequestContext();
    await deactivateCustomerAccount({
      userId: ctx.userId,
      tenantId: ctx.tenantId!,
      customerId: ctx.customerId,
    });
    return { ok: true as const };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not deactivate account." };
  }
}

export async function saveAccountAddressAction(input: AddressInput & { id?: string | undefined }) {
  try {
    const ctx = await requireCustomerRequestContext();
    if (!(await customerMutationRateLimit(ctx.userId, "address"))) {
      return { ok: false as const, error: "Too many updates. Try again later." };
    }
    const address = input.id
      ? await updateCustomerAddress(ctx, input.id, input)
      : await createCustomerAddress(ctx, input);
    return { ok: true as const, address };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not save address." };
  }
}

export async function deleteAccountAddressAction(addressId: string) {
  try {
    const ctx = await requireCustomerRequestContext();
    await deleteCustomerAddress(ctx, addressId);
    return { ok: true as const };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not delete address." };
  }
}

export async function setDefaultAccountAddressAction(addressId: string) {
  try {
    const ctx = await requireCustomerRequestContext();
    await setDefaultCustomerAddress(ctx, addressId);
    return { ok: true as const };
  } catch (error) {
    const e = normalizeError(error);
    return {
      ok: false as const,
      error: e.expose ? e.message : "Could not update default address.",
    };
  }
}

export async function updateAccountPreferencesAction(input: {
  emailOffers: boolean;
  smsUpdates: boolean;
  whatsappOffers: boolean;
  fragranceFree: boolean;
  routineReminders: boolean;
  communicationChannel?: "email" | "sms" | "whatsapp" | undefined;
}) {
  try {
    const ctx = await requireCustomerRequestContext();
    if (!(await customerMutationRateLimit(ctx.userId, "preferences"))) {
      return { ok: false as const, error: "Too many updates. Try again later." };
    }
    const preferences = await updateCustomerPreferences(ctx, input);
    return { ok: true as const, preferences };
  } catch (error) {
    const e = normalizeError(error);
    return { ok: false as const, error: e.expose ? e.message : "Could not save preferences." };
  }
}

export async function deleteAccountRecommendationAction(recommendationId: string) {
  try {
    const ctx = await requireCustomerRequestContext();
    await deleteCustomerRecommendation(ctx, recommendationId);
    return { ok: true as const };
  } catch (error) {
    const e = normalizeError(error);
    if (error instanceof AppError && error.expose) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: e.expose ? e.message : "Could not remove recommendation." };
  }
}
