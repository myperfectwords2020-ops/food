import type { Prisma } from "@prisma/client";

export async function generateOrderNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.order.count({
    where: {
      tenantId,
      createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) },
    },
  });
  return `ELN-${year}-${String(count + 1).padStart(6, "0")}`;
}
