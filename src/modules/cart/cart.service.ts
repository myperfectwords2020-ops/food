import { randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";
import { resolvePublicTenantId } from "@/lib/tenants/public-tenant";
import { productPricingSelect } from "@/modules/catalog/product.include";
import { MAX_QUANTITY_PER_LINE } from "@/modules/commerce/commerce.constants";
import { breakdownToCartSummary, priceCartLines } from "@/modules/commerce/pricing.service";
import type { CartLineInput, CartSummary } from "@/types/commerce";

const cartItemSelect = { productId: true, quantity: true } as const;

export async function getOrCreateCustomerCart(customerId: string, tenantId: string) {
  const existing = await prisma.cart.findFirst({
    where: { tenantId, customerId, status: "ACTIVE" },
    include: { items: { select: cartItemSelect } },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { tenantId, customerId, status: "ACTIVE", currency: "NGN" },
    include: { items: { select: cartItemSelect } },
  });
}

export async function getCustomerCartSummary(context: RequestContext & { customerId: string }) {
  const snapshot = await getCustomerCartSnapshot(context);
  return snapshot.summary;
}

export async function getCustomerCartSnapshot(
  context: RequestContext & { customerId: string },
): Promise<{
  lines: CartLineInput[];
  summary: CartSummary;
}> {
  authorize(context, "cart.manage_own");
  const tenantId = context.tenantId!;
  const cart = await getOrCreateCustomerCart(context.customerId, tenantId);
  const lines = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  const summary = await buildSummaryForCart(cart.items, tenantId, { includeDelivery: false });
  return { lines, summary };
}

async function buildSummaryForCart(
  items: { productId: string; quantity: number }[],
  tenantId: string,
  options?: { includeDelivery?: boolean; deliveryMinor?: number },
) {
  const products = await loadProductsForPricing(
    tenantId,
    items.map((i) => i.productId),
  );
  const { breakdown } = priceCartLines(items, products, options);
  return breakdownToCartSummary(breakdown);
}

export async function loadProductsForPricing(tenantId: string, productIds: string[]) {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.product.findMany({
    where: { tenantId, id: { in: productIds } },
    select: productPricingSelect,
  });
  return new Map(rows.map((p) => [p.id, p]));
}

export async function setCartItemQuantity(
  context: RequestContext & { customerId: string },
  productId: string,
  quantity: number,
) {
  authorize(context, "cart.manage_own");
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY_PER_LINE) {
    throw new ValidationError("Invalid quantity.");
  }

  const tenantId = context.tenantId!;
  const cart = await getOrCreateCustomerCart(context.customerId, tenantId);

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!product && quantity > 0) throw new ValidationError("Product is not available.");

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { tenantId, cartId: cart.id, productId, quantity },
      update: { quantity },
    });
  }

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    select: cartItemSelect,
  });
  return buildSummaryForCart(items, tenantId, { includeDelivery: false });
}

export async function mergeGuestLinesIntoCustomerCart(
  context: RequestContext & { customerId: string },
  guestLines: { productId: string; quantity: number }[],
) {
  authorize(context, "cart.manage_own");
  const tenantId = context.tenantId!;
  const cart = await getOrCreateCustomerCart(context.customerId, tenantId);
  const incoming = guestLines.filter((line) => line.quantity > 0);
  if (incoming.length === 0) {
    return getCustomerCartSummary(context);
  }

  await prisma.$transaction(async (tx) => {
    const productIds = [...new Set(incoming.map((l) => l.productId))];
    const [products, existingItems] = await Promise.all([
      tx.product.findMany({
        where: { tenantId, id: { in: productIds }, status: "ACTIVE" },
        select: { id: true, stock: true, reservedStock: true },
      }),
      tx.cartItem.findMany({
        where: { cartId: cart.id, productId: { in: productIds } },
        select: { productId: true, quantity: true },
      }),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));
    const existingById = new Map(existingItems.map((i) => [i.productId, i.quantity]));

    for (const line of incoming) {
      const product = productById.get(line.productId);
      if (!product) continue;
      const mergedQty = Math.min(
        (existingById.get(line.productId) ?? 0) + line.quantity,
        MAX_QUANTITY_PER_LINE,
      );
      const available = Math.max(0, product.stock - product.reservedStock);
      const finalQty = Math.min(mergedQty, available);
      if (finalQty <= 0) continue;

      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: line.productId } },
        create: { tenantId, cartId: cart.id, productId: line.productId, quantity: finalQty },
        update: { quantity: finalQty },
      });
    }
  });

  return getCustomerCartSummary(context);
}

export async function getCartLineInputs(context: RequestContext & { customerId: string }) {
  authorize(context, "cart.manage_own");
  const cart = await getOrCreateCustomerCart(context.customerId, context.tenantId!);
  return cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
}

export function createGuestSessionKey() {
  return randomBytes(32).toString("hex");
}

export async function getOrCreateGuestCart(sessionKey: string) {
  const tenantId = await resolvePublicTenantId();
  const existing = await prisma.cart.findFirst({
    where: { tenantId, sessionKey, status: "ACTIVE", customerId: null },
    include: { items: { select: cartItemSelect } },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { tenantId, sessionKey, status: "ACTIVE", currency: "NGN" },
    include: { items: { select: cartItemSelect } },
  });
}

export async function markCartConverted(cartId: string, tx: Prisma.TransactionClient) {
  await tx.cart.update({
    where: { id: cartId },
    data: { status: "CONVERTED" },
  });
}
