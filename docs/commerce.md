# Commerce (Phase 4)

## Cart lifecycle

- **ACTIVE** — default shopping cart (authenticated customer or guest `sessionKey`).
- **CONVERTED** — cart linked to a placed order; a new ACTIVE cart is created for the customer.
- Prices shown in the cart are informational; checkout recalculates from catalog + inventory.

## Guest cart

- Guests keep lines in `localStorage` until sign-in.
- On login, `mergeLocalCartAction` merges into the server cart (capped by inventory and max quantity).

## Checkout

1. Require **CUSTOMER** authentication (`/checkout` redirect).
2. Load lines from persisted cart (not client payload).
3. Server pricing (`priceCartLines`) + delivery fee from **`DeliveryStateRate`** for the customer’s Nigerian state (`resolveDeliveryMinorForState`). Admins configure per-state fees at `/admin/delivery`. Default seed: ₦3,500 every state until changed.
4. Transaction: order + item snapshots + shipping snapshot + inventory reservation + payment placeholder (`PENDING`).
5. Idempotency scope: `checkout.create` + customer + key.

## Inventory reservation

- `FOR UPDATE` row lock on product, increment `reservedStock`, create `InventoryReservation` with `expiresAt` (30 minutes).
- Phase 5 payment success converts reservation to sale; workers can release expired reservations.

## Order status transitions

Centralized in `transitionOrderStatus()` — see `order-status.service.ts`.

## Security

- No client-controlled totals, tenant, customer, or inventory.
- Order confirmation requires authenticated customer ownership (or matching httpOnly order cookie from same checkout session).

## Payment boundary (Phase 5)

Orders are created in `PENDING_PAYMENT` with a `Payment` row in `PENDING`. Paystack verification will transition payment and order status.
