import { Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";

import { ConflictError } from "@/lib/errors/app-error";
import { sellableStock } from "@/modules/catalog/product.mapper";
import { RESERVATION_TTL_MINUTES } from "@/modules/commerce/commerce.constants";

type ReserveLine = { productId: string; quantity: number };

/** Locks all products once, then reserves inventory for checkout (fewer round-trips). */
export async function reserveAllInventoryInTransaction(
  tx: PrismaTypes.TransactionClient,
  input: {
    tenantId: string;
    orderId: string;
    lines: ReserveLine[];
    actorUserId?: string | undefined;
  },
) {
  if (input.lines.length === 0) return;

  const productIds = [...new Set(input.lines.map((l) => l.productId))];
  const locked = await tx.$queryRaw<{ id: string; stock: number; reservedStock: number }[]>`
    SELECT id, stock, "reservedStock" FROM "Product"
    WHERE "tenantId" = ${input.tenantId}
      AND id IN (${Prisma.join(productIds)})
    FOR UPDATE
  `;

  const byId = new Map(locked.map((row) => [row.id, row]));
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

  for (const line of input.lines) {
    const row = byId.get(line.productId);
    if (!row) throw new ConflictError("Product unavailable.");
    if (sellableStock(row) < line.quantity) {
      throw new ConflictError("Insufficient inventory.");
    }
  }

  for (const line of input.lines) {
    const row = byId.get(line.productId)!;
    await tx.product.update({
      where: { id: line.productId },
      data: { reservedStock: { increment: line.quantity } },
    });

    await tx.inventoryReservation.create({
      data: {
        tenantId: input.tenantId,
        productId: line.productId,
        orderId: input.orderId,
        quantity: line.quantity,
        status: "ACTIVE",
        expiresAt,
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId: input.tenantId,
        productId: line.productId,
        type: "RESERVATION",
        delta: 0,
        balanceAfter: row.stock,
        referenceType: "order",
        referenceId: input.orderId,
        actorUserId: input.actorUserId ?? null,
      },
    });

    row.reservedStock += line.quantity;
  }
}

/** @deprecated Use reserveAllInventoryInTransaction for multi-line checkout. */
export async function reserveInventoryInTransaction(
  tx: PrismaTypes.TransactionClient,
  input: {
    tenantId: string;
    productId: string;
    quantity: number;
    orderId: string;
    actorUserId?: string | undefined;
  },
) {
  await reserveAllInventoryInTransaction(tx, {
    tenantId: input.tenantId,
    orderId: input.orderId,
    lines: [{ productId: input.productId, quantity: input.quantity }],
    actorUserId: input.actorUserId,
  });
}
