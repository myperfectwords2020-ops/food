import type { Permission } from "@/lib/auth/permissions";
import { authorize } from "@/lib/auth/authorize-context";
import { requireRequestContext } from "@/lib/auth/request-context";
import type { RequestContext } from "@/lib/auth/types";
import { normalizeError } from "@/lib/errors/app-error";

export type SecureActionResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Wrap server actions with auth + permission checks and safe errors. */
export async function runSecureAction<T>(
  permission: Permission,
  handler: (context: RequestContext) => Promise<T>,
): Promise<SecureActionResult<T>> {
  try {
    const context = await requireRequestContext();
    authorize(context, permission);
    const data = await handler(context);
    return { ok: true, data };
  } catch (error) {
    const appError = normalizeError(error);
    return {
      ok: false,
      error: {
        code: appError.code,
        message: appError.expose ? appError.message : "Request failed.",
      },
    };
  }
}
