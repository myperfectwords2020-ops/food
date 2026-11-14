import { requireRequestContext } from "@/lib/auth/request-context";
import {
  getAdminConversation,
  listAdminConversations,
} from "@/modules/ai/conversations/assistant-conversation.service";

export const liveAdminConversationService = {
  async listConversations(
    filters?: { q?: string | undefined; status?: string | undefined; channel?: string | undefined },
    page = 1,
    pageSize = 10,
  ) {
    const ctx = await requireRequestContext();
    return listAdminConversations(ctx, filters ?? {}, page, pageSize);
  },
  async getConversation(id: string) {
    const ctx = await requireRequestContext();
    return getAdminConversation(ctx, id);
  },
};
