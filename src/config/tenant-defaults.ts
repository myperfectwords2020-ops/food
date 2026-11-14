import { getEnv } from "@/config/env";

/** Server-side default tenant slug for customer registration/login (never trust client override alone). */
export function getDefaultTenantSlug(): string {
  return process.env["DEFAULT_TENANT_SLUG"] ?? "elanskin-dev";
}

export function getPublicAppUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
