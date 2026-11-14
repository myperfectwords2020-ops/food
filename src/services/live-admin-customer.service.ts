import { requireRequestContext } from "@/lib/auth/request-context";
import { getAdminCustomer, listAdminCustomers } from "@/modules/customers/admin-customer.service";
import type { AdminCustomerFilters } from "@/types/admin";

export const liveAdminCustomerService = {
  async listCustomers(filters?: AdminCustomerFilters) {
    const ctx = await requireRequestContext();
    return listAdminCustomers(ctx, filters);
  },
  async getCustomer(id: string) {
    const ctx = await requireRequestContext();
    return getAdminCustomer(ctx, id);
  },
};
