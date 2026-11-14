import type { Role } from "@prisma/client";

/**
 * Central permission definitions. Use `authorize(context, permission)` — not inline role checks.
 * Customer-private resources also require ownership checks in services (orders.read_own, etc.).
 */
export const Permissions = {
  "profile.read_own": ["CUSTOMER"],
  "profile.update_own": ["CUSTOMER"],
  "addresses.read_own": ["CUSTOMER"],
  "addresses.manage_own": ["CUSTOMER"],
  "preferences.read_own": ["CUSTOMER"],
  "preferences.update_own": ["CUSTOMER"],
  "orders.read_own": ["CUSTOMER"],
  "recommendations.read_own": ["CUSTOMER"],
  "cart.manage_own": ["CUSTOMER"],
  "checkout.create_own": ["CUSTOMER"],
  "payments.initialize_own": ["CUSTOMER"],
  "payments.verify_own": ["CUSTOMER"],
  "leads.create": ["CUSTOMER"],
  "assistant.use": ["CUSTOMER"],

  "products.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "products.create": ["ADMIN", "SUPER_ADMIN"],
  "products.update": ["ADMIN", "SUPER_ADMIN"],
  "products.delete": ["ADMIN", "SUPER_ADMIN"],

  "inventory.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "inventory.manage": ["ADMIN", "SUPER_ADMIN"],

  "orders.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "orders.manage": ["STAFF", "ADMIN", "SUPER_ADMIN"],

  "payments.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],

  "customers.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "customers.manage": ["STAFF", "ADMIN", "SUPER_ADMIN"],

  "leads.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "leads.manage": ["STAFF", "ADMIN", "SUPER_ADMIN"],

  "crm.leads.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.create": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.update": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.assign": ["ADMIN", "SUPER_ADMIN"],
  "crm.leads.qualify": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.convert": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.notes": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "crm.leads.delete": ["ADMIN", "SUPER_ADMIN"],

  "conversations.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "conversations.manage": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "conversations.reply": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "conversations.assign": ["ADMIN", "SUPER_ADMIN"],
  "conversations.resolve": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "conversations.close": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "conversations.internal_note": ["STAFF", "ADMIN", "SUPER_ADMIN"],

  "ai.manage": ["ADMIN", "SUPER_ADMIN"],

  "automations.read": ["ADMIN", "SUPER_ADMIN"],
  "automations.manage": ["ADMIN", "SUPER_ADMIN"],

  "analytics.read": ["ADMIN", "SUPER_ADMIN"],

  "settings.manage": ["ADMIN", "SUPER_ADMIN"],

  "users.manage": ["ADMIN", "SUPER_ADMIN"],

  "tenants.manage": ["SUPER_ADMIN"],
  "audit_logs.read": ["ADMIN", "SUPER_ADMIN"],
  "platform.admin": ["SUPER_ADMIN"],

  "tenant.read": ["STAFF", "ADMIN", "SUPER_ADMIN"],
  "tenant.write": ["ADMIN", "SUPER_ADMIN"],
} as const;

export type Permission = keyof typeof Permissions;

export function roleHasPermission(role: Role, permission: Permission): boolean {
  const allowed = Permissions[permission] as readonly Role[];
  return allowed.includes(role);
}

export function permissionsForRole(role: Role): Permission[] {
  return (Object.keys(Permissions) as Permission[]).filter((p) => roleHasPermission(role, p));
}

export function isStaffRole(role: Role): boolean {
  return role === "STAFF" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isCustomerRole(role: Role): boolean {
  return role === "CUSTOMER";
}

/** Permissions required to access any /admin route (coarse gate). */
export function canAccessAdminArea(role: Role): boolean {
  return isStaffRole(role);
}
