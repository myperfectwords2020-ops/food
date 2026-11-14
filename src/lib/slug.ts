export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueProductSlug(
  tenantId: string,
  base: string,
  excludeProductId?: string,
): Promise<string> {
  const { prisma } = await import("@/lib/db/prisma");
  let slug = slugify(base);
  if (!slug) slug = "product";
  let suffix = 0;
  for (;;) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.product.findFirst({
      where: {
        tenantId,
        slug: candidate,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
  }
}
