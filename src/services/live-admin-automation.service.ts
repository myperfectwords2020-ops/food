import { requireRequestContext } from "@/lib/auth/request-context";
import {
  createAutomationAdmin,
  getAutomationAdmin,
  listAutomationsAdmin,
  publishAutomationAdmin,
  setAutomationEnabledAdmin,
  updateAutomationAdmin,
} from "@/modules/automations/automation-admin.service";
import type { AdminAutomation, WorkflowNode } from "@/types/admin";

export const liveAdminAutomationService = {
  async listAutomations() {
    const ctx = await requireRequestContext();
    return listAutomationsAdmin(ctx);
  },
  async getAutomation(id: string) {
    const ctx = await requireRequestContext();
    return getAutomationAdmin(ctx, id);
  },
  async createAutomation(input: {
    name: string;
    description: string;
    trigger: string;
    nodes: WorkflowNode[];
  }): Promise<AdminAutomation> {
    const ctx = await requireRequestContext();
    return createAutomationAdmin(ctx, input);
  },
  async updateAutomation(
    id: string,
    input: Partial<Pick<AdminAutomation, "name" | "description" | "trigger" | "status" | "nodes">>,
  ) {
    const ctx = await requireRequestContext();
    return updateAutomationAdmin(ctx, id, input);
  },
  async setAutomationEnabled(id: string, enabled: boolean) {
    const ctx = await requireRequestContext();
    return setAutomationEnabledAdmin(ctx, id, enabled);
  },
  async publishAutomation(id: string) {
    const ctx = await requireRequestContext();
    await publishAutomationAdmin(ctx, id);
  },
};
