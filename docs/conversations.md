# Conversations & human handoff (Phase 8)

Production customer support conversations build on the AI assistant channel (`AI_ASSISTANT`).

## Lifecycle

Statuses:

- `ACTIVE` — AI may respond (server-enforced).
- `HANDOFF_REQUESTED` — customer or AI requested human support; AI does not send normal replies.
- `HUMAN_ASSIGNED` — staff owns the thread.
- `RESOLVED` — completed; AI idle unless reopened.
- `CLOSED` — no new customer/staff messages.

Transitions are validated in `src/modules/conversations/conversation-status.ts` and applied only through `conversation.service.ts`.

## Message roles

| Role                | Customer API  | Staff API |
| ------------------- | ------------- | --------- |
| CUSTOMER            | yes           | yes       |
| AI                  | yes           | yes       |
| HUMAN (staff reply) | yes           | yes       |
| SYSTEM              | yes           | yes       |
| INTERNAL_NOTE       | **never**     | yes       |
| TOOL                | no (metadata) | optional  |

Sender identity is always derived from the authenticated request context.

## Services

- `src/modules/conversations/conversation.service.ts` — create, message, handoff, assign, read/unread, pagination, resolve/close/reopen.
- `src/modules/ai/conversations/assistant-conversation.service.ts` — assistant-specific helpers delegating to the conversation service.

## Authorization

Permissions (`src/lib/auth/permissions.ts`):

- `conversations.read` — inbox and detail
- `conversations.reply` — staff replies; self-assign
- `conversations.assign` — assign to other staff
- `conversations.resolve` / `conversations.close` — status changes
- `conversations.internal_note` — internal notes

Customers may only access conversations where `tenantId` and `customerId` match (IDOR-safe).

## AI boundary

`conversationBlocksAiResponses` is checked in:

- `live-assistant.service.ts` (before orchestration)
- `assistant-orchestrator.ts` (defense in depth)

Handoff is initiated via `requestHumanHandoff`, not by the model setting status directly.

## Pagination

Staff message history uses cursor pagination (`createdAt|id`) via `loadOlderStaffMessages`.

## Domain events

Emitted through the outbox: `CONVERSATION_CREATED`, `CONVERSATION_HANDOFF_REQUESTED`, `CONVERSATION_ASSIGNED`, `MESSAGE_CREATED`, `INTERNAL_NOTE_CREATED`, `CONVERSATION_RESOLVED`, `CONVERSATION_CLOSED`, `CONVERSATION_REOPENED`.

## Client state

TanStack Query keys: `src/lib/query/conversation-keys.ts`  
Admin mutations: `src/hooks/queries/use-admin-conversation-mutations.ts`

## Rate limits & idempotency

Assistant messaging uses existing Redis rate limits. Staff/customer message actions support `runIdempotent` scopes `conversation.staff_message` and `conversation.customer_message`.
