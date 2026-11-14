# Multi-tenancy (Phase 1)

## Model

- Each skincare business is a **Tenant** (`slug`, `name`, `status`).
- Tenant-owned rows include `tenantId` (products, customers, orders, leads, etc.).
- Users belong to a tenant (`User.tenantId`) except platform operators still use a tenant record in development seed.

## Email uniqueness

`User` uses `@@unique([tenantId, email])` — the same email may exist on different tenants, but not twice on one tenant.

## Trusted tenant context

**Never** use `tenantId` from JSON bodies, query strings, or hidden form fields as authority.

Tenant for staff/admin comes from `session.user.tenantId`.

For customer registration/login, tenant is resolved from **`DEFAULT_TENANT_SLUG`** (environment) until multi-store login UI exists.

## Query scoping

Use `tenantScopeWhere(sessionTenantId, role)` from `src/lib/db/tenant-query.ts`:

- `STAFF` / `ADMIN`: `{ tenantId: sessionTenantId }`
- `SUPER_ADMIN`: `{}` for cross-tenant reads (operational tenant selection comes in a later phase)

Services must compose:

```typescript
where: {
  id: resourceId,
  ...tenantScopeWhere(context.tenantId, context.role),
}
```

## Cross-tenant isolation tests

Seed includes `elanskin-other` with a product used to verify tenant B data is not returned when querying with tenant A context.

## SUPER_ADMIN

Platform administration permissions (`tenants.manage`, `platform.admin`) are limited to `SUPER_ADMIN`.

ADMIN does **not** receive platform-wide tenant management.
