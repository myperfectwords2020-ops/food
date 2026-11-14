"use server";

import { requireRequestContext } from "@/lib/auth/request-context";
import { AppError, normalizeError } from "@/lib/errors/app-error";
import { uploadAdminProductImage } from "@/modules/products/product-image.service";
import { adminService } from "@/services/index";
import type { AdminProductImage, AdminProductStatus } from "@/types/admin";

export async function uploadAdminProductImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string; storageKey: string } | { ok: false; error: string }> {
  try {
    const ctx = await requireRequestContext();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "Choose an image file to upload." };
    }
    const uploaded = await uploadAdminProductImage(ctx, file);
    return { ok: true, url: uploaded.url, storageKey: uploaded.storageKey };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      ok: false,
      error: normalized.expose ? normalized.message : "Image upload failed. Try again.",
    };
  }
}

export async function saveAdminProductAction(input: {
  id?: string | undefined;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  images: AdminProductImage[];
  concern: string;
  skinTypes: string[];
  ingredients: string[];
  stock: number;
  status: AdminProductStatus;
  usageInstructions: string;
  warnings: string;
  recommendationNote?: string | undefined;
  relatedProductIds: string[];
}): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  try {
    const primary = input.images[0]?.url ?? "";
    const base = {
      slug: input.slug,
      name: input.name,
      category: input.category,
      description: input.description,
      price: input.price,
      image: primary,
      images: input.images,
      concern: input.concern,
      skinTypes: input.skinTypes,
      ingredients: input.ingredients,
      stock: input.stock,
      status: input.status,
      usageInstructions: input.usageInstructions,
      warnings: input.warnings,
      recommendationNote: input.recommendationNote,
      relatedProductIds: input.relatedProductIds,
      badge: undefined,
    };

    if (input.id) {
      const updated = await adminService.updateProduct(input.id, base);
      if (!updated) return { ok: false, error: "Product not found." };
      return { ok: true, productId: updated.id };
    }

    const created = await adminService.createProduct(base);
    return { ok: true, productId: created.id };
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized instanceof AppError && normalized.expose) {
      return { ok: false, error: normalized.message };
    }
    return { ok: false, error: "Could not save product. Check your input and try again." };
  }
}

export async function archiveAdminProductAction(id: string): Promise<{ ok: boolean }> {
  const ok = await adminService.archiveProduct(id);
  return { ok };
}

export async function adjustInventoryAction(
  productId: string,
  delta: number,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: "Enter a non-zero adjustment." };
  }
  const product = await adminService.adjustStock(productId, delta, note, "Admin user");
  return { ok: Boolean(product) };
}

export async function saveAutomationAction(input: {
  id?: string | undefined;
  name: string;
  description: string;
  trigger: string;
  nodesJson: string;
  asDraft?: boolean | undefined;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  let nodes;
  try {
    nodes = JSON.parse(input.nodesJson) as import("@/types/admin").WorkflowNode[];
  } catch {
    return { ok: false, error: "Invalid workflow definition." };
  }
  const status = input.asDraft ? "draft" : undefined;
  if (input.id) {
    const updated = await adminService.updateAutomation(input.id, {
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      nodes,
      ...(status ? { status } : {}),
    });
    if (!updated) return { ok: false, error: "Automation not found." };
    return { ok: true, id: updated.id };
  }
  const created = await adminService.createAutomation({
    name: input.name,
    description: input.description,
    trigger: input.trigger,
    nodes,
  });
  return { ok: true, id: created.id };
}

export async function publishAutomationAction(id: string) {
  await adminService.publishAutomation(id);
}

export async function toggleAutomationAction(id: string, enabled: boolean) {
  await adminService.setAutomationEnabled(id, enabled);
}
