# Authentication (Phase 1)

## Stack

- **Auth.js / NextAuth v5** with **Credentials** provider
- **JWT sessions** (7-day max age)
- **bcrypt** password hashing (12 rounds)
- **HTTP-only**, **SameSite=lax**, **Secure** cookies in production

Route handler: `/api/auth/[...nextauth]`.

## Tenant-scoped login

Users are unique per `(tenantId, email)`. Login and registration resolve the store using **`DEFAULT_TENANT_SLUG`** (server env, default `elanskin-dev`) — not a client-controlled tenant id.

Credentials passed to Auth.js:

- `email`
- `password`
- `tenantSlug`

## Account status

Users must be `ACTIVE` to authenticate. Other statuses (`SUSPENDED`, `INVITED`, `DISABLED`) are rejected at login and on session refresh (`getSessionUser` re-reads status from PostgreSQL).

## Customer registration

`registerCustomer()` (server) creates `User`, `Customer`, and `CustomerPreference` in one transaction.

Server actions: `loginAction`, `registerAction`, `logoutAction` in `src/app/actions/auth.ts`.

## Rate limiting

Login and signup actions use Redis-backed `rateLimit()` when `REDIS_URL` is set. Without Redis, limits are not enforced (development only).

## Password reset (architecture)

- `PasswordResetToken` model stores **hashed** tokens
- `createPasswordResetToken()` / `consumePasswordResetToken()` in `src/modules/auth/auth.service.ts`
- Email delivery is not implemented in Phase 1

## Email verification

`User.emailVerified` is available for a later verification flow via `VerificationToken`.

## Development seed

After `npm run db:migrate` and `npm run db:seed`:

| Email                          | Role        | Password          |
| ------------------------------ | ----------- | ----------------- |
| `super@dev.elanskin.test`      | SUPER_ADMIN | `DevPassword123!` |
| `admin@dev.elanskin.test`      | ADMIN       | same              |
| `staff@dev.elanskin.test`      | STAFF       | same              |
| `customer.a@dev.elanskin.test` | CUSTOMER    | same              |
| `customer.b@dev.elanskin.test` | CUSTOMER    | same              |

Tenant slug: **`elanskin-dev`**

## UI

- `/account/login`, `/account/register` — minimal forms (existing design tokens)
- Protected account routes redirect unauthenticated users to login
- Checkout requires a signed-in **CUSTOMER**

## Logout

- Server action: `logoutAction()` in `src/app/actions/auth.ts` (audit log + `signOut`, redirect to `/`)
- **Sign out** appears in:
  - Storefront header (desktop) and mobile menu
  - Account sidebar and page header
  - Admin sidebar and top bar
  - Signed-in users are redirected away from `/account/login` and `/account/register` (middleware + server pages)
