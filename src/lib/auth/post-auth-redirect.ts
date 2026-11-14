import type { Role } from "@prisma/client";

export function homePathForRole(role: Role): string {
  return role === "CUSTOMER" ? "/account" : "/admin/dashboard";
}
