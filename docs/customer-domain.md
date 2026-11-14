# Customer domain (Phase 3)

## User vs Customer

- **User** — authentication identity (email, password hash, role, status).
- **Customer** — tenant-scoped business profile (contact, lifecycle, orders, preferences).

Registration creates both and links `Customer.userId`.

## Ownership

All `/account/*` mutations resolve:

`session → RequestContext → customerId + tenantId`

Never accept `customerId` or `tenantId` from the browser as authority.

Services call `getCustomerForUser()` and compare `context.customerId` to resource ownership.

## Profile

- Update: name and phone on `Customer` and name on `User`.
- Email change: `EmailChangeToken` + audit; verification email pending notification service.
- Password change: reuses Phase 1 bcrypt flow with rate limiting.

## Addresses

- CRUD via server actions; transactional default-address handling (one default per customer).
- Deleting an address used on a past order is blocked; Phase 4 will snapshot shipping on the order record.

## Preferences & consent

- Marketing (`emailOffers`, `whatsappOffers`) defaults **off**; consent timestamps stored on opt-in.
- Transactional SMS (`smsUpdates`) is separate from marketing.
- `skinProfile` JSON updated from the routine quiz and preference services.

## Recommendations

- `CustomerRecommendation` stores profile snapshot + scored results per run (append-only history).
- Customers can list and remove their own records only.

## Account deactivation

- Sets `User.status = DISABLED` and adjusts lifecycle; does not hard-delete financial or order history.

## Admin customers

- `/admin/customers` reads tenant-scoped customers with search (max 50) and safe DTOs.
- STAFF/ADMIN require `customers.read`; customers cannot access admin routes.

## Tenant isolation

All queries use `tenantScopeWhere(tenantId, role)` or explicit `tenantId` from context.

## Security

- Rate limits on account mutations (Redis when available).
- Audit events for profile, address, preference, consent, email change, password change, deactivation.
