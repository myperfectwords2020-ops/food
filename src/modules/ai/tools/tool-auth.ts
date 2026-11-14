import { AuthorizationError } from "@/lib/errors/app-error";
import type { RequestContext } from "@/lib/auth/types";
import type { AiToolContext, ToolAuthLevel } from "@/modules/ai/types/tool-context";

export function requireCustomerToolContext(
  ctx: AiToolContext,
): RequestContext & { customerId: string } {
  if (ctx.role === "ANONYMOUS" || !ctx.userId || !ctx.customerId) {
    throw new AuthorizationError("Sign in to access this assistant feature.");
  }
  return {
    userId: ctx.userId,
    email: ctx.email ?? "",
    role: "CUSTOMER",
    tenantId: ctx.tenantId,
    permissions: [],
    customerId: ctx.customerId,
  };
}

export function assertToolAuth(level: ToolAuthLevel, ctx: AiToolContext) {
  if (level === "public") return;
  if (level === "authenticated" && ctx.role !== "ANONYMOUS" && ctx.userId) return;
  if (level === "controlled" && ctx.userId) return;
  throw new AuthorizationError("This action requires an signed-in session.");
}
