import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const TTL_HOURS = 24;

export async function runIdempotent<T extends Record<string, unknown>>(
  tenantId: string,
  scope: string,
  key: string,
  handler: () => Promise<T>,
): Promise<T> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { tenantId_scope_key: { tenantId, scope, key } },
  });
  if (existing?.response) {
    return existing.response as T;
  }

  const result = await handler();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

  try {
    await prisma.idempotencyKey.create({
      data: {
        tenantId,
        scope,
        key,
        response: result as Prisma.InputJsonValue,
        expiresAt,
      },
    });
  } catch {
    const raced = await prisma.idempotencyKey.findUnique({
      where: { tenantId_scope_key: { tenantId, scope, key } },
    });
    if (raced?.response) return raced.response as T;
    throw new Error("Idempotency conflict.");
  }

  return result;
}
