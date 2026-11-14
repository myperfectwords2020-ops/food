import type { Role } from "@prisma/client";

export type AiToolContext = {
  tenantId: string;
  requestId: string;
  userId?: string | undefined;
  email?: string | undefined;
  customerId?: string | undefined;
  role: Role | "ANONYMOUS";
  conversationId: string;
};

export type ToolAuthLevel = "public" | "authenticated" | "controlled";

export type RegisteredTool = {
  name: string;
  description: string;
  auth: ToolAuthLevel;
  inputSchema: import("zod").ZodType;
  handler: (input: unknown, ctx: AiToolContext) => Promise<unknown>;
};
