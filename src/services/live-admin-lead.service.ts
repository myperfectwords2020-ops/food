import { requireRequestContext } from "@/lib/auth/request-context";
import { getAdminLead, listAdminLeads } from "@/modules/leads/admin-lead.service";
import type { AdminLeadFilters } from "@/types/admin";

export const liveAdminLeadService = {
  async listLeads(filters?: AdminLeadFilters) {
    const ctx = await requireRequestContext();
    return listAdminLeads(ctx, filters);
  },
  async getLead(id: string) {
    const ctx = await requireRequestContext();
    return getAdminLead(ctx, id);
  },
};
