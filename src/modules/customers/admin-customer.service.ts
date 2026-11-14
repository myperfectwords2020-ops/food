import type { LeadLifecycleStage } from "@prisma/client";

import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { ValidationError } from "@/lib/errors/app-error";
import { fromMinorUnits } from "@/lib/money";
import { skinProfileSchema } from "@/modules/customers/customer.validation";
import type { AdminCustomerDetail, AdminCustomerFilters, AdminOrderListItem } from "@/types/admin";
import type { OrderStatus } from "@/types/commerce";

const DEFAULT_PAGE_SIZE = 50;

function mapAdminOrderStatus(status: string): OrderStatus {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending_payment";
    case "PAID":
    case "PROCESSING":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "processing";
  }
}

function formatSkinProfile(raw: unknown): string {
  const parsed = skinProfileSchema.safeParse(raw);
  if (!parsed.success) return "No structured skin profile yet.";
  const p = parsed.data;
  const parts = [
    p.skinType ? `Skin type: ${p.skinType}` : null,
    p.concerns?.length ? `Concerns: ${p.concerns.join(", ")}` : null,
    p.goals?.length ? `Goals: ${p.goals.join(", ")}` : null,
    p.budgetPreference ? `Budget: ${p.budgetPreference}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No structured skin profile yet.";
}

function preferencesSummary(
  prefs: {
    emailOffers: boolean;
    smsUpdates: boolean;
    whatsappOffers: boolean;
    fragranceFree: boolean;
  } | null,
): string {
  if (!prefs) return "Default preferences";
  const bits: string[] = [];
  if (prefs.emailOffers) bits.push("Email offers");
  if (prefs.smsUpdates) bits.push("SMS updates");
  if (prefs.whatsappOffers) bits.push("WhatsApp");
  if (prefs.fragranceFree) bits.push("Fragrance-free");
  return bits.length ? bits.join(", ") : "No marketing opt-ins";
}

export async function listAdminCustomers(
  context: RequestContext,
  filters?: AdminCustomerFilters,
): Promise<AdminCustomerDetail[]> {
  authorize(context, "customers.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const lifecycle = filters?.lifecycle as LeadLifecycleStage | undefined;
  const q = filters?.q?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      ...tenantScopeWhere(tenantId, context.role),
      ...(lifecycle ? { lifecycle } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      preferences: true,
      orders: {
        select: { id: true, totalMinor: true, currency: true, createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      recommendations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      leads: { select: { id: true }, take: 1 },
      conversations: { select: { id: true }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
    take: DEFAULT_PAGE_SIZE,
  });

  return Promise.all(
    customers.map(async (c) => {
      const ordersAgg = await prisma.order.aggregate({
        where: { customerId: c.id, tenantId },
        _count: { id: true },
        _sum: { totalMinor: true },
      });

      const latestRec = c.recommendations[0];
      let recommendationSlugs: string[] = [];
      if (latestRec) {
        const results = latestRec.results as { productId?: string }[];
        const ids = results.map((r) => r.productId).filter(Boolean) as string[];
        if (ids.length) {
          const products = await prisma.product.findMany({
            where: { id: { in: ids }, tenantId },
            select: { slug: true },
          });
          recommendationSlugs = products.map((p) => p.slug);
        }
      }

      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email;

      return {
        id: c.id,
        name,
        email: c.email,
        phone: c.phone ?? "",
        lifecycle: c.lifecycle,
        ordersCount: ordersAgg._count.id,
        totalSpent: fromMinorUnits(ordersAgg._sum.totalMinor ?? 0, "NGN"),
        lastActivity: c.updatedAt.toISOString(),
        leadId: c.leads[0]?.id,
        preferencesSummary: preferencesSummary(c.preferences),
        recommendationSlugs,
        skinProfile: formatSkinProfile(c.preferences?.skinProfile),
        activityTimeline: [
          {
            id: `created-${c.id}`,
            label: "Customer record created",
            at: c.createdAt.toISOString(),
          },
        ],
        orderHistory: c.orders.map((o): AdminOrderListItem => ({
          id: o.id,
          customerName: name,
          customerEmail: c.email,
          itemCount: 0,
          total: fromMinorUnits(o.totalMinor, o.currency),
          status: mapAdminOrderStatus(o.status),
          paymentStatus: "pending",
          createdAt: o.createdAt.toISOString(),
          displayDate: o.createdAt.toLocaleDateString("en-NG"),
        })),
        conversationIds: c.conversations.map((x) => x.id),
      };
    }),
  );
}

export async function getAdminCustomer(
  context: RequestContext,
  customerId: string,
): Promise<AdminCustomerDetail | null> {
  const rows = await listAdminCustomers(context, {});
  return rows.find((c) => c.id === customerId) ?? null;
}
