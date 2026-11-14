import { requireRequestContext } from "@/lib/auth/request-context";
import { getAdminOrderDetail, listAdminOrders } from "@/modules/orders/admin-order.service";
import type { AdminOrderFilters } from "@/types/admin";

export const liveAdminOrderService = {
  async listOrders(filters?: AdminOrderFilters) {
    const ctx = await requireRequestContext();
    return listAdminOrders(ctx, filters);
  },
  async getOrder(id: string) {
    const ctx = await requireRequestContext();
    return getAdminOrderDetail(ctx, id);
  },
};
