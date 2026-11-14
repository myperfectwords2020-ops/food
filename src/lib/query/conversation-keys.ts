export const conversationKeys = {
  all: ["conversations"] as const,
  staffList: (filters: Record<string, string | number | undefined>) =>
    [...conversationKeys.all, "staff-list", filters] as const,
  staffDetail: (id: string) => [...conversationKeys.all, "staff-detail", id] as const,
  staffMessages: (id: string, cursor?: string) =>
    [...conversationKeys.all, "staff-messages", id, cursor ?? "latest"] as const,
};
