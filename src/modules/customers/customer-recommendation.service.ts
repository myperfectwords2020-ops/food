import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors/app-error";
import { getCustomerForUser } from "@/modules/customers/customer-access.service";

export type CustomerRecommendationView = {
  id: string;
  createdAt: string;
  profile: unknown;
  products: { slug: string; name: string; reasons: string[] }[];
};

export async function listCustomerRecommendations(
  context: RequestContext & { customerId: string },
  limit = 10,
): Promise<CustomerRecommendationView[]> {
  authorize(context, "recommendations.read_own");
  await getCustomerForUser(context);

  const rows = await prisma.customerRecommendation.findMany({
    where: { tenantId: context.tenantId!, customerId: context.customerId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const productIds = rows.flatMap((r) => {
    const results = r.results as { productId?: string; reasons?: string[] }[];
    return results.map((x) => x.productId).filter(Boolean) as string[];
  });

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(productIds)] }, tenantId: context.tenantId! },
    select: { id: true, slug: true, name: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return rows.map((row) => {
    const results = row.results as { productId?: string; reasons?: string[] }[];
    const items = results
      .map((r) => {
        const product = r.productId ? byId.get(r.productId) : undefined;
        if (!product) return null;
        return {
          slug: product.slug,
          name: product.name,
          reasons: r.reasons ?? [],
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      profile: row.profile,
      products: items,
    };
  });
}

export async function deleteCustomerRecommendation(
  context: RequestContext & { customerId: string },
  recommendationId: string,
) {
  authorize(context, "recommendations.read_own");
  const deleted = await prisma.customerRecommendation.deleteMany({
    where: {
      id: recommendationId,
      customerId: context.customerId,
      tenantId: context.tenantId!,
    },
  });
  if (deleted.count === 0) throw new NotFoundError();
  return { ok: true as const };
}
