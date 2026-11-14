import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { fromMinorUnits } from "@/lib/money";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { toCommerceOrder } from "@/modules/orders/order.mapper";
import type { AdminOrderDetail, AdminOrderFilters, AdminOrderListItem } from "@/types/admin";
import type { OrderStatus } from "@/types/commerce";

const PAGE_SIZE = 50;

function mapFilterStatus(status: OrderStatus): import("@prisma/client").OrderStatus | undefined {
  switch (status) {
    case "pending_payment":
      return "PENDING_PAYMENT";
    case "paid":
      return "PAID";
    case "processing":
      return "PROCESSING";
    case "shipped":
      return "SHIPPED";
    case "delivered":
      return "DELIVERED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
      return "REFUNDED";
    default:
      return undefined;
  }
}

function mapListStatus(status: string): OrderStatus {
  if (status === "PENDING_PAYMENT") return "pending_payment";
  if (status === "PAID") return "processing";
  if (status === "PROCESSING") return "processing";
  if (status === "SHIPPED") return "shipped";
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  if (status === "REFUNDED") return "refunded";
  return "processing";
}

export async function listAdminOrders(context: RequestContext, filters?: AdminOrderFilters) {
  authorize(context, "orders.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? PAGE_SIZE;
  const q = filters?.q?.trim();
  const statusFilter = filters?.status ? mapFilterStatus(filters.status) : undefined;

  const where = {
    ...tenantScopeWhere(tenantId, context.role),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: AdminOrderListItem[] = rows.map((o) => ({
    id: o.id,
    customerName: o.customerName ?? o.customerEmail,
    customerEmail: o.customerEmail,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    total: fromMinorUnits(o.totalMinor, o.currency),
    status: mapListStatus(o.status),
    paymentStatus: o.payments[0]?.status === "SUCCEEDED" ? "paid" : "pending",
    createdAt: o.createdAt.toISOString(),
    displayDate: o.createdAt.toLocaleDateString("en-NG"),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminOrderDetail(context: RequestContext, orderId: string) {
  authorize(context, "orders.read");
  const tenantId = context.tenantId!;
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...tenantScopeWhere(tenantId, context.role) },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) return null;

  const succeededPayment = order.payments.find((p) => p.status === "SUCCEEDED");
  const referencePayment =
    succeededPayment ?? order.payments.find((p) => p.providerReference) ?? order.payments[0];

  const commerce = toCommerceOrder(order);
  const timeline: AdminOrderDetail["timeline"] = [
    {
      id: "created",
      label: `Order ${order.orderNumber} placed`,
      at: order.createdAt.toISOString(),
    },
  ];
  if (succeededPayment?.paidAt) {
    timeline.push({
      id: "paid",
      label: "Payment confirmed (Paystack)",
      at: succeededPayment.paidAt.toISOString(),
      detail: succeededPayment.providerReference ?? undefined,
    });
  }

  const detail: AdminOrderDetail = {
    ...commerce,
    customerName: order.customerName ?? commerce.customer.email,
    timeline,
    paymentReference: referencePayment?.providerReference ?? undefined,
  };
  return detail;
}

export async function getOrderForCustomerAccess(
  context: RequestContext & { customerId: string },
  orderId: string,
) {
  authorize(context, "orders.read_own");
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: context.customerId,
      tenantId: context.tenantId!,
    },
    include: { items: true, payments: { take: 1, orderBy: { createdAt: "desc" } } },
  });
  if (!order) throw new NotFoundError();
  return toCommerceOrder(order);
}
