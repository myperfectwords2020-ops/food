# Notifications (Phase 10)

## Flow

```text
Domain event / automation → NotificationService → consent → template → queue → provider → status/webhook
```

Business code must not call providers directly.

## Channels

`EMAIL`, `WHATSAPP`, `IN_APP`, `SMS` (SMS not configured).

## Providers

- **Email:** Resend (`EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`, optional `EMAIL_FROM_NAME`)
- **WhatsApp:** Meta Cloud API (`WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_SECRET`)

Health: `getProviderHealth()` in `notification-env.ts`.

## Templates

`NotificationTemplate` rows per tenant, versioned, status `DRAFT|ACTIVE|ARCHIVED`.

Variables: allow-list in `template-render.service.ts`.

## Consent

`communication-preference.service.ts` — marketing requires opt-in via `CustomerPreference`.

## Queues

BullMQ `notifications` queue, job `deliver` → `processNotificationDelivery`.

Without Redis, delivery runs inline after create.

## Idempotency

`Notification.idempotencyKey` unique per tenant + `runIdempotent` scope `notification.send`.

## Webhooks

`POST /api/webhooks/whatsapp` — verifies `x-hub-signature-256`.

## Customer UI

`/account/notifications` — in-app notifications (read / mark all read).

## Unsubscribe

`/unsubscribe?token=` — signed marketing opt-out (HMAC with `AUTH_SECRET`).

## Automation

`SEND_EMAIL` / `SEND_WHATSAPP` actions call `createAndQueueNotification`.
