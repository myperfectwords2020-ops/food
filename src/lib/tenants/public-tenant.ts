import { getDefaultTenantSlug } from "@/config/tenant-defaults";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors/app-error";

let cachedTenantId: string | null = null;

/** Storefront tenant — server-resolved, never from client params. */
export async function resolvePublicTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;
  const slug = getDefaultTenantSlug();
  const tenant = await prisma.tenant.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true },
  });
  if (!tenant) throw new NotFoundError("Store is unavailable.");
  cachedTenantId = tenant.id;
  return tenant.id;
}
