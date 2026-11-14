# Automation system (Phase 9)

Event-driven workflow execution for tenant-scoped automations.

## Architecture

```text
Domain event → registerAutomationDomainHandlers → trigger matcher
  → AutomationRun (deduped) → BullMQ `automations` queue (or inline if no Redis)
  → automation-executor → action registry → application services
```

Business modules emit domain events only; they do not call automations directly.

## Models

- `Automation` — draft/active/paused/archived, `triggerType`, JSON definition
- `AutomationVersion` — immutable published snapshots
- `AutomationRun` — execution state, trigger event idempotency key
- `AutomationStepRun` — per-step status for debugging/retries
- `InternalNotification`, `CustomerTag` — action side effects

## Triggers

Registered in `src/modules/automations/types/triggers.ts`. Unknown triggers cannot publish or execute.

## Workflow definition

Stored as `{ version: 1, nodes: WorkflowNode[], nodeConfig?: Record<nodeId, config> }`.

Validated by `workflow-validator.ts` before publish (no cycles, max steps, known actions).

## Conditions

Safe deterministic engine in `conditions/condition-engine.ts` — no `eval`, no SQL.

## Actions

Registry in `actions/action-registry.ts`. External messaging actions (`SEND_EMAIL`, `SEND_WHATSAPP`, `SEND_SMS`) fail with explicit not-configured errors.

`SEND_EMAIL`, `SEND_WHATSAPP`, and `SEND_SMS` call `NotificationService` (`createAndQueueNotification`) — not providers directly. See [notifications.md](./notifications.md).

## Workers

`npm run worker` registers the `automations` queue processor calling `executeAutomationRun`.

## Admin

`/admin/automations` uses `liveAdminAutomationService` (list, edit, publish, pause, run history).

Permissions: `automations.read`, `automations.manage` (publish/pause included).

## Idempotency

Unique `(tenantId, automationId, automationVersionId, triggerEventId)` on `AutomationRun`.

## Loop protection

Events with `causationId` prefixed `automation:` are ignored by the trigger matcher.
