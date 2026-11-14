import { getOrderForCustomerAccess } from "@/modules/orders/admin-order.service";
import { createOrderFromCheckout } from "@/modules/orders/checkout.service";
import type { OrderService } from "./order.service";

export const liveOrderService: OrderService = {
  async createOrder() {
    throw new Error("Use submitCheckoutAction for order creation.");
  },
  async getOrder(id: string) {
    const { requireCustomerRequestContext } = await import("@/lib/auth/request-context");
    try {
      const ctx = await requireCustomerRequestContext();
      return getOrderForCustomerAccess(ctx, id);
    } catch {
      return null;
    }
  },
  async listOrdersForAccount() {
    return [];
  },
};

export { createOrderFromCheckout };
