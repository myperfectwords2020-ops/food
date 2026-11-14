import type { AnalyticsEventType, Prisma } from "@prisma/client";

import { getDefaultTenantSlug } from "@/config/tenant-defaults";
import { prisma } from "@/lib/db/prisma";
import { findTenantBySlug } from "@/modules/tenants/tenant.repository";

export type RecordAnalyticsEventInput = {
  tenantId: string;
  eventType: AnalyticsEventType;
  productId?: string | null;
  customerId?: string | null;
  sessionKey?: string | null;
  conversationId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function resolveDefaultTenantId(): Promise<string> {
  const tenant = await findTenantBySlug(getDefaultTenantSlug());
  if (!tenant) throw new Error("Tenant not configured.");
  return tenant.id;
}

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput) {
  const data: Prisma.AnalyticsEventCreateInput = {
    tenantId: input.tenantId,
    eventType: input.eventType,
    productId: input.productId ?? null,
    customerId: input.customerId ?? null,
    sessionKey: input.sessionKey ?? null,
    conversationId: input.conversationId ?? null,
    orderId: input.orderId ?? null,
  };
  if (input.metadata !== undefined) {
    data.metadata = input.metadata as Prisma.InputJsonValue;
  }
  return prisma.analyticsEvent.create({ data });
}

/** Paid order attributed when line items match a recent assistant add-to-cart for the customer. */
export async function attributeAssistantOrderIfEligible(input: {
  tenantId: string;
  orderId: string;
  customerId: string;
  productIds: string[];
}) {
  const lookback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const existing = await prisma.analyticsEvent.findFirst({
    where: {
      tenantId: input.tenantId,
      orderId: input.orderId,
      eventType: "ASSISTANT_ORDER_ATTRIBUTED",
    },
  });
  if (existing) return;

  const assistantTouches = await prisma.analyticsEvent.findMany({
    where: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      eventType: { in: ["ASSISTANT_ADD_TO_CART", "ASSISTANT_RECOMMENDATION_CLICK"] },
      productId: { in: input.productIds },
      createdAt: { gte: lookback },
    },
    select: { id: true },
    take: 1,
  });
  if (assistantTouches.length === 0) return;

  await recordAnalyticsEvent({
    tenantId: input.tenantId,
    eventType: "ASSISTANT_ORDER_ATTRIBUTED",
    orderId: input.orderId,
    customerId: input.customerId,
    metadata: { productIds: input.productIds },
  });
}
