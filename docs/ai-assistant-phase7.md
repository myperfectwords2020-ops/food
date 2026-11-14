# Phase 7 — AI assistant architecture

## Flow

Customer UI (`/assistant`, FAB) → server actions → `liveAssistantService` → conversation persistence → `runAssistantOrchestrator` → tools → catalog/cart/CRM/order services.

The LLM never touches Prisma. With `AI_API_KEY`, OpenAI-compatible chat completions may call tools; without a key, the **heuristic orchestrator** runs the same tools deterministically.

## Tools

Registered in `src/modules/ai/tools/tool-registry.ts` with Zod inputs and auth levels (`public`, `authenticated`, `controlled`).

## Safety

- Prompt injection patterns → refusal
- Urgent medical language → escalation + handoff status
- Rate limits per tenant/user (anonymous vs signed-in)
- Tool call and output size limits
- System prompt centralized under `src/modules/ai/prompts/`

## Conversations

Stored in `Conversation` / `Message` (`AI_ASSISTANT` channel). Structured UI payloads live in message `metadata.content`.

## Admin

`/admin/ai` conversation/handoff counts from database. `/admin/conversations` lists AI conversations when wired through `liveAdminConversationService`.
