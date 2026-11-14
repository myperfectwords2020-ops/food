import { requireRequestContext } from "@/lib/auth/request-context";
import {
  adjustAdminStock,
  archiveAdminProduct,
  createAdminProduct,
  getAdminProduct,
  listAdminInventory,
  listAdminInventoryTransactions,
  listAdminProducts,
  updateAdminProduct,
} from "@/modules/products/admin-product.service";
import type { AdminProduct, AdminProductFilters } from "@/types/admin";

export const liveAdminCatalogService = {
  async listProducts(filters?: AdminProductFilters) {
    const ctx = await requireRequestContext();
    return listAdminProducts(ctx, filters);
  },
  async getProduct(id: string) {
    const ctx = await requireRequestContext();
    return getAdminProduct(ctx, id);
  },
  async createProduct(input: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">) {
    const ctx = await requireRequestContext();
    return createAdminProduct(ctx, input);
  },
  async updateProduct(id: string, input: Partial<AdminProduct>) {
    const ctx = await requireRequestContext();
    return updateAdminProduct(ctx, id, input);
  },
  async archiveProduct(id: string) {
    const ctx = await requireRequestContext();
    return archiveAdminProduct(ctx, id);
  },
  async listInventory() {
    const ctx = await requireRequestContext();
    return listAdminInventory(ctx);
  },
  async listInventoryTransactions(productId?: string) {
    const ctx = await requireRequestContext();
    return listAdminInventoryTransactions(ctx, productId);
  },
  async adjustStock(productId: string, delta: number, note: string, _actor: string) {
    const ctx = await requireRequestContext();
    return adjustAdminStock(ctx, productId, delta, note);
  },
};
