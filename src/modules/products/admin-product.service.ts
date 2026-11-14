import type { ProductStatus, RoutineStep } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { prisma } from "@/lib/db/prisma";
import { fromMinorUnits, toMinorUnits } from "@/lib/money";
import { ensureUniqueProductSlug, slugify } from "@/lib/slug";
import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { ValidationError } from "@/lib/errors/app-error";
import { catalogProductInclude } from "@/modules/catalog/product.include";
import type { CatalogProductRecord } from "@/modules/catalog/product.include";
import { sellableStock } from "@/modules/catalog/product.mapper";
import { parseAdminProductInput } from "@/modules/products/product.validation";
import type { AdminProduct, AdminProductFilters, AdminProductStatus } from "@/types/admin";

function mapStatus(status: ProductStatus): AdminProductStatus {
  if (status === "ACTIVE") return "active";
  if (status === "ARCHIVED") return "archived";
  return "draft";
}

function toAdminProduct(record: CatalogProductRecord): AdminProduct {
  const sortedImages = [...record.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const image = sortedImages[0]?.url ?? "";
  const product: AdminProduct = {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category?.name ?? "Skincare",
    description: record.description,
    price: fromMinorUnits(record.priceMinor, record.currency),
    image,
    images: sortedImages.map((img) => ({
      url: img.url,
      ...(img.storageKey ? { storageKey: img.storageKey } : {}),
    })),
    concern: record.concerns[0]?.concern.name ?? "",
    skinTypes: record.skinTypes.map((s) => s.skinType.name),
    ingredients: record.ingredients.map((i) => i.ingredient.name),
    stock: sellableStock(record),
    status: mapStatus(record.status),
    usageInstructions: record.usageInstructions ?? "",
    warnings: record.warnings ?? "",
    relatedProductIds: [],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
  if (record.badge) product.badge = record.badge;
  return product;
}

async function upsertCategory(tenantId: string, name: string) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { tenantId_slug: { tenantId, slug } },
    update: { name, active: true },
    create: { tenantId, name, slug, active: true },
  });
}

async function syncTaxonomy(
  tenantId: string,
  productId: string,
  input: { ingredients: string[]; skinTypes: string[]; concern: string },
) {
  await prisma.productIngredient.deleteMany({ where: { productId } });
  await prisma.productSkinType.deleteMany({ where: { productId } });
  await prisma.productConcern.deleteMany({ where: { productId } });

  for (const name of input.ingredients) {
    const ing = await prisma.ingredient.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(name) } },
      update: { name },
      create: { tenantId, name, slug: slugify(name) },
    });
    await prisma.productIngredient.create({ data: { productId, ingredientId: ing.id } });
  }

  for (const name of input.skinTypes) {
    const st = await prisma.skinType.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(name) } },
      update: { name },
      create: { tenantId, name, slug: slugify(name) },
    });
    await prisma.productSkinType.create({ data: { productId, skinTypeId: st.id } });
  }

  if (input.concern) {
    const concern = await prisma.skinConcern.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(input.concern) } },
      update: { name: input.concern },
      create: { tenantId, name: input.concern, slug: slugify(input.concern) },
    });
    await prisma.productConcern.create({ data: { productId, concernId: concern.id } });
  }
}

function routineStepFromCategory(category: string): RoutineStep | null {
  const c = category.toLowerCase();
  if (c.includes("cleanser")) return "CLEANSE";
  if (c.includes("serum")) return "TREAT";
  if (c.includes("moisturizer")) return "MOISTURIZE";
  if (c.includes("sunscreen")) return "PROTECT";
  if (c.includes("toner")) return "TONER";
  if (c.includes("exfoliat")) return "EXFOLIATE";
  if (
    c.includes("lipstick") ||
    c.includes("foundation") ||
    c.includes("blush") ||
    c.includes("mascara") ||
    c.includes("fragrance") ||
    c.includes("mist") ||
    c.includes("makeup")
  ) {
    return "OTHER";
  }
  return null;
}

export async function listAdminProducts(
  context: RequestContext,
  filters?: AdminProductFilters,
): Promise<AdminProduct[]> {
  authorize(context, "products.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const statusFilter =
    filters?.status === "active"
      ? "ACTIVE"
      : filters?.status === "archived"
        ? "ARCHIVED"
        : filters?.status === "draft"
          ? "DRAFT"
          : undefined;

  const rows = await prisma.product.findMany({
    where: {
      ...tenantScopeWhere(tenantId, context.role),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { slug: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: catalogProductInclude,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map(toAdminProduct);
}

export async function getAdminProduct(context: RequestContext, id: string) {
  authorize(context, "products.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");
  const row = await prisma.product.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
    include: catalogProductInclude,
  });
  return row ? toAdminProduct(row) : null;
}

async function syncProductImages(
  tenantId: string,
  productId: string,
  productName: string,
  images: { url: string; storageKey?: string | undefined }[],
) {
  await prisma.productImage.deleteMany({ where: { productId } });
  if (images.length === 0) return;
  await prisma.productImage.createMany({
    data: images.map((image, sortOrder) => ({
      tenantId,
      productId,
      url: image.url,
      storageKey: image.storageKey ?? null,
      alt: productName,
      sortOrder,
    })),
  });
}

export async function createAdminProduct(
  context: RequestContext,
  raw: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">,
) {
  authorize(context, "products.create");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const parsed = parseAdminProductInput(raw);
  const slug = await ensureUniqueProductSlug(tenantId, parsed.slug || parsed.name);
  const category = await upsertCategory(tenantId, parsed.category);
  const status: ProductStatus =
    parsed.status === "active" ? "ACTIVE" : parsed.status === "archived" ? "ARCHIVED" : "DRAFT";

  const product = await prisma.product.create({
    data: {
      tenantId,
      slug,
      name: parsed.name,
      shortDescription: parsed.description.slice(0, 240),
      description: parsed.description,
      categoryId: category.id,
      status,
      priceMinor: toMinorUnits(parsed.price),
      currency: "NGN",
      stock: parsed.stock,
      usageInstructions: parsed.usageInstructions,
      warnings: parsed.warnings,
      badge: parsed.badge ?? null,
      routineStep: routineStepFromCategory(parsed.category),
    },
    include: catalogProductInclude,
  });

  await syncProductImages(tenantId, product.id, parsed.name, parsed.images);

  await syncTaxonomy(tenantId, product.id, {
    ingredients: parsed.ingredients,
    skinTypes: parsed.skinTypes,
    concern: parsed.concern,
  });

  const refreshed = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    include: catalogProductInclude,
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "product.created",
    entityType: "Product",
    entityId: product.id,
  });

  return toAdminProduct(refreshed);
}

export async function updateAdminProduct(
  context: RequestContext,
  id: string,
  raw: Partial<AdminProduct>,
) {
  authorize(context, "products.update");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const existing = await prisma.product.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
    include: catalogProductInclude,
  });
  if (!existing) return null;

  const merged = { ...toAdminProduct(existing), ...raw };
  const parsed = parseAdminProductInput(merged);
  const category = await upsertCategory(tenantId, parsed.category);
  const status: ProductStatus =
    parsed.status === "active" ? "ACTIVE" : parsed.status === "archived" ? "ARCHIVED" : "DRAFT";

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.name,
      slug: parsed.slug,
      shortDescription: parsed.description.slice(0, 240),
      description: parsed.description,
      categoryId: category.id,
      status,
      priceMinor: toMinorUnits(parsed.price),
      stock: parsed.stock,
      usageInstructions: parsed.usageInstructions,
      warnings: parsed.warnings,
      badge: parsed.badge ?? null,
      routineStep: routineStepFromCategory(parsed.category),
    },
  });

  await syncProductImages(tenantId, id, parsed.name, parsed.images);

  await syncTaxonomy(tenantId, id, {
    ingredients: parsed.ingredients,
    skinTypes: parsed.skinTypes,
    concern: parsed.concern,
  });

  const refreshed = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: catalogProductInclude,
  });

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "product.updated",
    entityType: "Product",
    entityId: id,
  });

  return toAdminProduct(refreshed);
}

export async function archiveAdminProduct(context: RequestContext, id: string) {
  authorize(context, "products.delete");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const updated = await prisma.product.updateMany({
    where: { id, tenantId, status: { not: "ARCHIVED" } },
    data: { status: "ARCHIVED" },
  });
  if (updated.count === 0) return false;

  await writeAuditLog({
    tenantId,
    actorId: context.userId,
    action: "product.archived",
    entityType: "Product",
    entityId: id,
  });
  return true;
}

export async function listAdminInventory(context: RequestContext) {
  authorize(context, "inventory.read");
  const products = await listAdminProducts(context);
  return products.map((product) => ({
    product,
    lowStock: product.stock > 0 && product.stock <= 5,
    outOfStock: product.stock <= 0,
  }));
}

export async function listAdminInventoryTransactions(context: RequestContext, productId?: string) {
  authorize(context, "inventory.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const rows = await prisma.inventoryTransaction.findMany({
    where: {
      tenantId,
      ...(productId ? { productId } : {}),
    },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    type: r.type.toLowerCase() as "adjustment" | "sale" | "restock" | "return",
    delta: r.delta,
    balanceAfter: r.balanceAfter,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    actor: r.actorUserId ?? "System",
  }));
}

export async function adjustAdminStock(
  context: RequestContext,
  productId: string,
  delta: number,
  note: string,
) {
  const { adjustInventory } = await import("@/modules/inventory/inventory.service");
  const type = delta > 0 ? "RESTOCK" : "ADJUSTMENT";
  await adjustInventory(context, { productId, delta, type, note });
  return getAdminProduct(context, productId);
}
