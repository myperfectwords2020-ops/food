"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/index";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  recordAnalyticsEvent,
  resolveDefaultTenantId,
} from "@/modules/analytics/analytics-event.service";

const productSchema = z.object({
  productId: z.string().min(1),
  sessionKey: z.string().max(64).optional(),
  conversationId: z.string().max(64).optional(),
});

async function clientRateKey(suffix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return `analytics:${suffix}:${ip}`;
}

async function optionalCustomerId() {
  const user = await getSessionUser();
  return user?.role === "CUSTOMER" ? user.customerId : null;
}

export async function recordProductViewAction(input: { productId: string; sessionKey?: string }) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const allowed = await rateLimit(await clientRateKey(`view:${parsed.data.productId}`), 60, 900);
  if (!allowed) return { ok: false as const };

  const tenantId = await resolveDefaultTenantId();
  await recordAnalyticsEvent({
    tenantId,
    eventType: "PRODUCT_VIEW",
    productId: parsed.data.productId,
    customerId: await optionalCustomerId(),
    sessionKey: parsed.data.sessionKey ?? null,
  });
  return { ok: true as const };
}

export async function recordStorefrontAddToCartAction(input: {
  productId: string;
  sessionKey?: string;
}) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const allowed = await rateLimit(await clientRateKey(`cart:${parsed.data.productId}`), 40, 900);
  if (!allowed) return { ok: false as const };

  const tenantId = await resolveDefaultTenantId();
  await recordAnalyticsEvent({
    tenantId,
    eventType: "STOREFRONT_ADD_TO_CART",
    productId: parsed.data.productId,
    customerId: await optionalCustomerId(),
    sessionKey: parsed.data.sessionKey ?? null,
  });
  return { ok: true as const };
}

export async function recordAssistantAddToCartAction(input: {
  productId: string;
  conversationId?: string;
}) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const tenantId = await resolveDefaultTenantId();
  await recordAnalyticsEvent({
    tenantId,
    eventType: "ASSISTANT_ADD_TO_CART",
    productId: parsed.data.productId,
    customerId: await optionalCustomerId(),
    conversationId: parsed.data.conversationId ?? null,
  });
  return { ok: true as const };
}

export async function recordAssistantRecommendationClickAction(input: {
  productId: string;
  conversationId?: string;
}) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const tenantId = await resolveDefaultTenantId();
  await recordAnalyticsEvent({
    tenantId,
    eventType: "ASSISTANT_RECOMMENDATION_CLICK",
    productId: parsed.data.productId,
    customerId: await optionalCustomerId(),
    conversationId: parsed.data.conversationId ?? null,
  });
  return { ok: true as const };
}
