import { prisma } from "@/lib/db/prisma";

export async function findTenantBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, slug: true, name: true },
  });
}

export async function findTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, status: true },
  });
}
