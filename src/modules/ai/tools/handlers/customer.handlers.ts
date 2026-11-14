import { getCustomerForUser } from "@/modules/customers/customer-access.service";
import { getCustomerOrderById, listOrdersForCustomer } from "@/modules/orders/order-access.service";
import { requireCustomerToolContext } from "@/modules/ai/tools/tool-auth";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { getOrderDetailsSchema, getOrderStatusSchema } from "@/modules/ai/tools/tool-schemas";
import { fromMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/db/prisma";
import type { RequestContext } from "@/lib/auth/types";

function toCustomerCtx(ctx: AiToolContext): RequestContext & { customerId: string } {
  return requireCustomerToolContext(ctx);
}

export async function getCustomerProfileHandler(_input: unknown, ctx: AiToolContext) {
  const customerCtx = toCustomerCtx(ctx);
  const customer = await getCustomerForUser(customerCtx);
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    lifecycle: customer.lifecycle,
  };
}

export async function getCustomerPreferencesHandler(_input: unknown, ctx: AiToolContext) {
  const customerCtx = toCustomerCtx(ctx);
  const prefs = await prisma.customerPreference.findFirst({
    where: { tenantId: ctx.tenantId, customerId: customerCtx.customerId },
    select: {
      emailOffers: true,
      fragranceFree: true,
      skinProfile: true,
      routineReminders: true,
    },
  });
  return { preferences: prefs ?? null };
}

export async function getOrderStatusHandler(input: unknown, ctx: AiToolContext) {
  const customerCtx = toCustomerCtx(ctx);
  const { orderId } = getOrderStatusSchema.parse(input);
  const order = await getCustomerOrderById(customerCtx, orderId);
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    paymentStatus: order.payments[0]?.status ?? "PENDING",
  };
}

export async function getOrderDetailsHandler(input: unknown, ctx: AiToolContext) {
  const customerCtx = toCustomerCtx(ctx);
  const { orderId } = getOrderDetailsSchema.parse(input);
  const order = await getCustomerOrderById(customerCtx, orderId);
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: fromMinorUnits(order.totalMinor, order.currency),
    currency: order.currency,
    items: order.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      lineTotal: fromMinorUnits(i.lineTotalMinor, order.currency),
    })),
    shipping: order.address
      ? {
          city: order.address.city,
          state: order.address.state,
          country: order.address.country,
        }
      : null,
  };
}

export async function listRecentOrdersHandler(_input: unknown, ctx: AiToolContext) {
  const customerCtx = toCustomerCtx(ctx);
  const orders = await listOrdersForCustomer(customerCtx);
  return {
    orders: orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
