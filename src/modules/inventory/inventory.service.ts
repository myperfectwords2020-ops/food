import type { InventoryTransactionType } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import type { RequestContext } from "@/lib/auth/types";
import { authorize } from "@/lib/auth/authorize-context";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { sellableStock } from "@/modules/catalog/product.mapper";

export async function adjustInventory(
  context: RequestContext,
  input: {
    productId: string;
    delta: number;
    type: InventoryTransactionType;
    note?: string | undefined;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
  },
) {
  authorize(context, "inventory.manage");
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new ValidationError("Inventory delta must be a non-zero integer.");
  }

  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: input.productId, ...tenantScopeWhere(tenantId, context.role) },
    });
    if (!product) throw new NotFoundError();

    const nextStock = product.stock + input.delta;
    if (nextStock < 0 || product.reservedStock > nextStock) {
      throw new ConflictError("Insufficient stock for this adjustment.");
    }

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { stock: nextStock },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        productId: product.id,
        type: input.type,
        delta: input.delta,
        balanceAfter: updated.stock,
        note: input.note ?? null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        actorUserId: context.userId,
      },
    });

    await writeAuditLog({
      tenantId,
      actorId: context.userId,
      action: "inventory.adjusted",
      entityType: "Product",
      entityId: product.id,
      metadata: { delta: input.delta, type: input.type },
    });

    return updated;
  });
}

/** Reserve stock for future checkout (Phase 3+). */
export async function reserveInventory(
  context: RequestContext,
  productId: string,
  quantity: number,
  referenceId: string,
) {
  authorize(context, "inventory.manage");
  if (!Number.isInteger(quantity) || quantity <= 0) throw new ValidationError("Invalid quantity.");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: productId, tenantId } });
    if (!product || availableUnits(product) < quantity) {
      throw new ConflictError("Unable to reserve inventory.");
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { reservedStock: { increment: quantity } },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        productId,
        type: "RESERVATION",
        delta: 0,
        balanceAfter: updated.stock,
        referenceType: "checkout",
        referenceId,
        actorUserId: context.userId,
      },
    });
    return updated;
  });
}

export async function releaseInventory(
  context: RequestContext,
  productId: string,
  quantity: number,
  referenceId: string,
) {
  authorize(context, "inventory.manage");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.updateMany({
      where: { id: productId, tenantId, reservedStock: { gte: quantity } },
      data: { reservedStock: { decrement: quantity } },
    });
    if (updated.count === 0) throw new ConflictError("Unable to release reservation.");

    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        productId,
        type: "RELEASE",
        delta: 0,
        balanceAfter: product.stock,
        referenceType: "checkout",
        referenceId,
        actorUserId: context.userId,
      },
    });
    return product;
  });
}

export function availableUnits(product: { stock: number; reservedStock: number }) {
  return sellableStock(product);
}
