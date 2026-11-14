# AI system (Phase 0)

## Current state

- **Customer UI:** Assistant FAB and `/assistant` use `liveAssistantService` with persisted `Conversation` / `Message` rows.
- **Orchestrator:** `runAssistantOrchestrator` with tool registry and optional OpenAI provider.
- **Human handoff:** When status is `HANDOFF_REQUESTED`, `HUMAN_ASSIGNED`, `RESOLVED`, or `CLOSED`, the server blocks normal AI replies (`conversationBlocksAiResponses`). Handoff is applied via `requestHumanHandoff`, not by the model setting status directly.

See [conversations.md](./conversations.md) for the full support workflow.

## Planned architecture (later phases)

```text
Client → Server Action / API
  → AIService (provider abstraction)
  → controlled tools (product search, order status, lead capture)
  → never raw SQL, shell, or client-controlled amounts
```

Conversations and messages will map to `Conversation` / `Message` with `ConversationChannel.AI_ASSISTANT`.

## Security

- AI output is untrusted; render as plain text, not HTML.
- Tool calls must go through application services with authz and tenant scope.

See [backend-api-contracts.md](./backend-api-contracts.md) for UI-facing contracts.
