import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { checkoutTransactionOptions } from "@/lib/db/transaction-options";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import {
  getCartLineInputs,
  getOrCreateCustomerCart,
  loadProductsForPricing,
  markCartConverted,
} from "@/modules/cart/cart.service";
import { resolveDeliveryMinorForState } from "@/modules/commerce/delivery-rate.service";
import { runIdempotent } from "@/modules/commerce/idempotency.service";
import {
  breakdownToCartSummary,
  priceCartLines,
  type PriceBreakdown,
} from "@/modules/commerce/pricing.service";
import { nigeriaStateName } from "@/lib/geo/nigeria-states";
import { reserveAllInventoryInTransaction } from "@/modules/inventory/checkout-inventory.service";
import { generateOrderNumber } from "@/modules/orders/order-number.service";
import { checkoutInputSchema, type CheckoutInput } from "@/modules/orders/checkout.validation";

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  summary: ReturnType<typeof breakdownToCartSummary>;
};

export async function createOrderFromCheckout(
  context: RequestContext & { customerId: string },
  raw: unknown,
  idempotencyKey: string,
): Promise<CheckoutResult> {
  authorize(context, "checkout.create_own");
  const tenantId = context.tenantId!;
  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new ValidationError("Missing checkout idempotency key.");
  }

  const parsed = checkoutInputSchema.parse(raw);
  const cartLines = await getCartLineInputs(context);
  if (cartLines.length === 0) throw new ValidationError("Your bag is empty.");

  return runIdempotent(tenantId, "checkout.create", `${context.customerId}:${idempotencyKey}`, () =>
    executeCheckout(context, parsed, cartLines),
  );
}

async function executeCheckout(
  context: RequestContext & { customerId: string },
  input: CheckoutInput,
  cartLines: { productId: string; quantity: number }[],
): Promise<CheckoutResult> {
  const tenantId = context.tenantId!;
  const productIds = cartLines.map((l) => l.productId);
  const productMap = await loadProductsForPricing(tenantId, productIds);

  const { deliveryMinor } = await resolveDeliveryMinorForState(tenantId, input.state);
  const { breakdown, issues } = priceCartLines(cartLines, productMap, {
    includeDelivery: true,
    deliveryMinor,
  });
  const blocking = issues.filter(
    (i) => i.code === "OUT_OF_STOCK" || i.code === "PRODUCT_UNAVAILABLE",
  );
  if (blocking.length > 0 || breakdown.lines.length === 0) {
    throw new ConflictError("Some items in your bag are no longer available.");
  }

  const cart = await getOrCreateCustomerCart(context.customerId, tenantId);
  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: context.customerId, tenantId },
  });

  const orderResult = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx, tenantId);
    const order = await tx.order.create({
      data: {
        tenantId,
        customerId: context.customerId,
        orderNumber,
        status: "PENDING_PAYMENT",
        currency: breakdown.currency,
        subtotalMinor: breakdown.subtotalMinor,
        deliveryMinor: breakdown.deliveryMinor,
        discountMinor: breakdown.discountMinor,
        taxMinor: breakdown.taxMinor,
        totalMinor: breakdown.totalMinor,
        customerEmail: input.email.trim().toLowerCase(),
        customerPhone: input.phone,
        customerName: `${input.firstName} ${input.lastName}`.trim(),
        deliveryMethod: input.deliveryMethod,
        shippingFirstName: input.firstName,
        shippingLastName: input.lastName,
        shippingPhone: input.phone,
        shippingLine1: input.street,
        shippingLine2: input.line2 ?? null,
        shippingCity: input.city,
        shippingState: nigeriaStateName(input.state),
        shippingPostalCode: input.postalCode ?? null,
        shippingCountry: input.country ?? "NG",
      },
    });

    await tx.orderItem.createMany({
      data: breakdown.lines.map((line) => ({
        tenantId,
        orderId: order.id,
        productId: line.productId,
        productName: line.name,
        productSlug: line.slug,
        productSku: line.sku,
        unitPriceMinor: line.unitPriceMinor,
        quantity: line.quantity,
        lineTotalMinor: line.lineTotalMinor,
      })),
    });

    await reserveAllInventoryInTransaction(tx, {
      tenantId,
      orderId: order.id,
      lines: breakdown.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
      actorUserId: context.userId,
    });

    await tx.payment.create({
      data: {
        tenantId,
        orderId: order.id,
        status: "PENDING",
        amountMinor: breakdown.totalMinor,
        currency: breakdown.currency,
      },
    });

    await markCartConverted(cart.id, tx);
    await tx.cart.create({
      data: { tenantId, customerId: context.customerId, status: "ACTIVE", currency: "NGN" },
    });

    return order;
  }, checkoutTransactionOptions);

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "order.created",
    entityType: "Order",
    entityId: orderResult.id,
    metadata: { orderNumber: orderResult.orderNumber },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  return {
    orderId: orderResult.id,
    orderNumber: orderResult.orderNumber,
    summary: breakdownToCartSummary(breakdown),
  };
}
