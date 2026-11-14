import { Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";

import { ConflictError } from "@/lib/errors/app-error";

/** Converts ACTIVE reservations into sold stock after verified payment. */
export async function finalizeInventoryForPaidOrder(
  tx: PrismaTypes.TransactionClient,
  input: { tenantId: string; orderId: string; actorUserId?: string | undefined },
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      tenantId: input.tenantId,
      orderId: input.orderId,
      status: "ACTIVE",
    },
  });

  if (reservations.length === 0) return;

  const productIds = [...new Set(reservations.map((r) => r.productId))];
  const locked = await tx.$queryRaw<{ id: string; stock: number; reservedStock: number }[]>`
    SELECT id, stock, "reservedStock" FROM "Product"
    WHERE "tenantId" = ${input.tenantId}
      AND id IN (${Prisma.join(productIds)})
    FOR UPDATE
  `;
  const byId = new Map(locked.map((row) => [row.id, { ...row }]));

  for (const reservation of reservations) {
    const row = byId.get(reservation.productId);
    if (!row) throw new ConflictError("Product unavailable.");
    if (row.reservedStock < reservation.quantity) {
      throw new ConflictError("Inventory reservation mismatch.");
    }
    if (row.stock < reservation.quantity) {
      throw new ConflictError("Insufficient inventory to finalize sale.");
    }

    const balanceAfter = row.stock - reservation.quantity;
    await tx.product.update({
      where: { id: reservation.productId },
      data: {
        stock: { decrement: reservation.quantity },
        reservedStock: { decrement: reservation.quantity },
      },
    });

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "CONVERTED" },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId: input.tenantId,
        productId: reservation.productId,
        type: "SALE",
        delta: -reservation.quantity,
        balanceAfter,
        referenceType: "order",
        referenceId: input.orderId,
        actorUserId: input.actorUserId ?? null,
      },
    });

    row.stock = balanceAfter;
    row.reservedStock -= reservation.quantity;
  }
}

/** Releases ACTIVE reservations when payment fails or order is cancelled. */
export async function releaseInventoryForOrder(
  tx: PrismaTypes.TransactionClient,
  input: { tenantId: string; orderId: string; actorUserId?: string | undefined },
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      tenantId: input.tenantId,
      orderId: input.orderId,
      status: "ACTIVE",
    },
  });

  if (reservations.length === 0) return;

  for (const reservation of reservations) {
    const product = await tx.product.findFirst({
      where: { id: reservation.productId, tenantId: input.tenantId },
    });
    if (!product) continue;

    await tx.product.update({
      where: { id: reservation.productId },
      data: { reservedStock: { decrement: reservation.quantity } },
    });

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "RELEASED" },
    });

    await tx.inventoryTransaction.create({
      data: {
        tenantId: input.tenantId,
        productId: reservation.productId,
        type: "RELEASE",
        delta: 0,
        balanceAfter: product.stock,
        referenceType: "order",
        referenceId: input.orderId,
        actorUserId: input.actorUserId ?? null,
      },
    });
  }
}
