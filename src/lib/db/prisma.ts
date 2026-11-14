import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
  });
}

/** After `prisma generate`, restart dev or let this discard a stale singleton missing new models. */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (process.env["NODE_ENV"] === "development" && cached) {
    const hasDeliveryModel = Boolean(
      (cached as PrismaClient & { deliveryStateRate?: { upsert?: unknown } }).deliveryStateRate
        ?.upsert,
    );
    if (!hasDeliveryModel) {
      void cached.$disconnect();
      globalForPrisma.prisma = undefined;
    }
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
