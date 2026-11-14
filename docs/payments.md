# Payments (Phase 5)

## Overview

Paystack handles card/bank payments. The **server** is the source of truth for amount, currency, and paid status. The browser and query strings are never trusted as proof of payment.

## Flow

1. Checkout creates an `Order` (`PENDING_PAYMENT`) and a `Payment` (`PENDING`).
2. `initializePaymentForOrder` creates or reuses a pending attempt, generates a secure reference (`eln_pay_*`), and calls Paystack initialize with the **order total** from PostgreSQL.
3. The customer completes payment on Paystack.
4. **Verification** runs via:
   - Return URL on `/order-confirmation` (server calls Paystack verify), and/or
   - `POST /api/webhooks/paystack` (signature-checked, idempotent via `WebhookEvent`).
5. On verified success: `Payment` → `SUCCEEDED`, `Order` → `PAID`, inventory reservations → `CONVERTED` (stock sold).

## Payment attempts

One `Order` may have multiple `Payment` rows (failed retries). Only one active `PENDING`/`PROCESSING` attempt at a time; success is idempotent.

## Environment

```env
PAYSTACK_SECRET_KEY=          # server only
PAYSTACK_WEBHOOK_SECRET=      # optional; signature uses secret key per Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=  # optional for inline UI; redirect flow uses server init
NEXT_PUBLIC_APP_URL=            # required for Paystack callback_url
```

### Local testing with ngrok (HTTPS)

Paystack webhooks require HTTPS. With `npm run dev` on port 3000:

1. In another terminal: `npm run tunnel` (or `ngrok http 3000`).
2. Copy the `https://….ngrok-free.dev` URL from the ngrok UI (`http://127.0.0.1:4040`) or CLI.
3. Set `NEXT_PUBLIC_APP_URL` to that HTTPS URL (no trailing slash) and **restart** `npm run dev`.
4. In Paystack Dashboard → Settings → Webhooks, set:
   `https://<your-ngrok-host>/api/webhooks/paystack`

The free ngrok URL changes when you restart the tunnel unless you use a reserved domain on your ngrok account.

## API

| Surface                                    | Purpose                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `initializePaymentAction(orderId)`         | Customer-owned order, server amount                 |
| `verifyPaymentAction(orderId, reference?)` | Server-side Paystack verify                         |
| `POST /api/webhooks/paystack`              | Provider events (`charge.success`, `charge.failed`) |

## Security

- Tenant scoping on all payment/order lookups.
- Amount and currency matched against the order on every success path.
- Webhook HMAC (`x-paystack-signature`) validated against raw body.
- Audit actions: `PAYMENT_INITIALIZED`, `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`, webhook events.

## Events

`ORDER_PAID` and `PAYMENT_SUCCEEDED` are written to `DomainEventOutbox` in the same transaction as order/inventory updates, then dispatched in-process. Later phases can consume the outbox from workers.

## Refunds

`RefundService` is a stub boundary only; do not set `REFUNDED` without a future provider-confirmed refund.
