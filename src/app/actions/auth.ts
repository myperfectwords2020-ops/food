"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDefaultTenantSlug } from "@/config/tenant-defaults";
import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { getSessionUser, signIn, signOut } from "@/lib/auth/index";
import { ConflictError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/security/rate-limit";
import { registerCustomer } from "@/modules/auth/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(32).optional(),
});

async function clientIpKey(prefix: string, email: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return `${prefix}:${ip}:${email.toLowerCase()}`;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const allowed = await rateLimit(await clientIpKey("login", parsed.data.email), 10, 900);
  if (!allowed) {
    return { ok: false as const, error: "Too many attempts. Try again later." };
  }

  const tenantSlug = getDefaultTenantSlug();

  const callbackUrl = formData.get("callbackUrl")?.toString() || "/account";

  try {
    const result = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
      tenantSlug,
    });
    if (result?.error) {
      return { ok: false as const, error: "Invalid email or password." };
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false as const, error: "Invalid email or password." };
    }
    throw err;
  }

  redirect(callbackUrl);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please check your details and try again." };
  }

  const allowed = await rateLimit(await clientIpKey("signup", parsed.data.email), 5, 3600);
  if (!allowed) {
    return { ok: false as const, error: "Too many signup attempts. Try again later." };
  }

  const tenantSlug = getDefaultTenantSlug();

  try {
    await registerCustomer({ ...parsed.data, tenantSlug });
  } catch (err) {
    if (err instanceof ConflictError) {
      return { ok: false as const, error: err.message };
    }
    return { ok: false as const, error: "Unable to create account." };
  }

  const result = await signIn("credentials", {
    redirect: false,
    email: parsed.data.email,
    password: parsed.data.password,
    tenantSlug,
  });
  if (result?.error) {
    redirect("/account/login");
  }

  redirect("/account");
}

export async function logoutAction() {
  const user = await getSessionUser();
  if (user) {
    await writeAuditLog({
      tenantId: user.tenantId ?? undefined,
      actorId: user.id,
      action: "auth.logout",
      entityType: "User",
      entityId: user.id,
    });
  }
  await signOut({ redirectTo: "/" });
}
