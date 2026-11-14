export const assistantKeys = {
  all: ["assistant"] as const,
  conversation: (id: string) => [...assistantKeys.all, "conversation", id] as const,
};
