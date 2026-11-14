import type { AssistantMessageContent, AssistantProductRef } from "@/types/assistant";
import { toAssistantProductRef } from "@/modules/ai/tools/product-dto";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { getAiLimits } from "@/modules/ai/config/ai-limits";
import { TOOL_REGISTRY } from "@/modules/ai/tools/tool-registry";
import { executeTool } from "@/modules/ai/tools/execute-tool";
import { runHeuristicTurn } from "@/modules/ai/orchestrator/heuristic-orchestrator";
import { getEnv } from "@/config/env";
import { ASSISTANT_SYSTEM_PROMPT } from "@/modules/ai/prompts/system";
import { z } from "zod";

type ToolCall = { id: string; type?: "function"; function: { name: string; arguments: string } };

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
};

/** The chat renders plain text, so model markdown would show as raw syntax or untrusted remote images. */
export function toPlainAssistantText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** OpenAI-compatible chat completions with tools; falls back to heuristic on failure. */
export async function runOpenAiTurn(
  userMessage: string,
  ctx: AiToolContext,
): Promise<AssistantMessageContent> {
  const limits = getAiLimits();
  const apiKey = getEnv().AI_API_KEY;
  if (!apiKey) return runHeuristicTurn(userMessage, ctx);

  const tools = TOOL_REGISTRY.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.inputSchema),
    },
  }));

  const messages: ChatMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  let toolCallsUsed = 0;
  for (let step = 0; step < limits.maxOrchestrationSteps; step++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), limits.timeoutMs);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: limits.model,
          temperature: limits.temperature,
          max_tokens: limits.maxOutputTokens,
          messages,
          tools,
          tool_choice: "auto",
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return runHeuristicTurn(userMessage, ctx);
    }

    const json = (await response.json()) as {
      choices?: {
        message?: {
          content?: string | null;
          tool_calls?: ToolCall[];
        };
      }[];
    };
    const message = json.choices?.[0]?.message;
    if (!message) return runHeuristicTurn(userMessage, ctx);

    if (message.tool_calls?.length) {
      // OpenAI rejects tool results unless the preceding assistant turn carries the matching
      // tool_calls, and every listed call must receive a tool message.
      messages.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls,
      });
      for (const call of message.tool_calls) {
        let result: unknown;
        if (toolCallsUsed >= limits.maxToolCallsPerTurn) {
          result = { error: "Tool call limit reached for this turn" };
        } else {
          toolCallsUsed++;
          let parsedArgs: unknown = {};
          try {
            parsedArgs = JSON.parse(call.function.arguments || "{}");
          } catch {
            parsedArgs = {};
          }
          try {
            result = await executeTool(call.function.name, parsedArgs, ctx);
          } catch (err) {
            result = {
              error: err instanceof Error ? err.message : "Tool failed",
            };
          }
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result).slice(0, limits.maxToolOutputChars),
        });
      }
      continue;
    }

    const text = toPlainAssistantText(message.content ?? "");
    if (!text) return runHeuristicTurn(userMessage, ctx);

    const structured = await buildStructuredFromTools(messages, text);
    if (structured) return structured;

    return { type: "text", text };
  }

  return runHeuristicTurn(userMessage, ctx);
}

type ProductSummary = { slug: string; name: string };

function parseToolResult(m: ChatMessage): Record<string, unknown> | null {
  try {
    return JSON.parse(m.content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Resolve catalog summaries to cart-ready refs (real product IDs) from the tenant catalog. */
async function resolveProductRefs(
  summaries: ProductSummary[],
  reason?: string,
): Promise<AssistantProductRef[]> {
  const { getPublicProductBySlug } = await import("@/modules/catalog/public-catalog.service");
  const refs: AssistantProductRef[] = [];
  for (const summary of summaries) {
    const product = await getPublicProductBySlug(summary.slug);
    if (product) refs.push(toAssistantProductRef(product, reason));
  }
  return refs;
}

async function buildStructuredFromTools(
  messages: ChatMessage[],
  text: string,
): Promise<AssistantMessageContent | null> {
  const toolResults = messages
    .filter((m) => m.role === "tool" && m.content)
    .map((m) => ({ name: m.name, data: parseToolResult(m) }))
    .filter((r): r is { name: string | undefined; data: Record<string, unknown> } =>
      Boolean(r.data),
    );

  const latestRanked = [...toolResults]
    .reverse()
    .find((r) => r.name === "getRecommendations" && Array.isArray(r.data["ranked"]));
  if (latestRanked) {
    const ranked = latestRanked.data["ranked"] as { card: AssistantProductRef }[];
    const products = ranked.map((r) => r.card).slice(0, 4);
    if (products.length) {
      return {
        type: "recommendations",
        intro: text,
        explanation:
          "Ranked from in-stock catalog items by our recommendation engine. Always check labels for allergens.",
        products,
      };
    }
  }

  const latestCompare = [...toolResults]
    .reverse()
    .find((r) => r.name === "compareProducts" && Array.isArray(r.data["products"]));
  if (latestCompare) {
    const products = await resolveProductRefs(
      (latestCompare.data["products"] as ProductSummary[]).slice(0, 4),
    );
    if (products.length >= 2) return { type: "comparison", summary: text, products };
  }

  const seen = new Set<string>();
  const found: ProductSummary[] = [];
  for (const r of toolResults) {
    const list =
      r.name === "searchProducts" && Array.isArray(r.data["products"])
        ? (r.data["products"] as ProductSummary[])
        : r.name === "getProductDetails" && r.data["product"]
          ? [r.data["product"] as ProductSummary]
          : [];
    for (const p of list) {
      if (!p?.slug || seen.has(p.slug)) continue;
      seen.add(p.slug);
      found.push(p);
    }
  }
  if (found.length === 0) return null;

  const lowerText = text.toLowerCase();
  const mentioned = found.filter((p) => lowerText.includes(p.name.toLowerCase()));
  const products = await resolveProductRefs((mentioned.length ? mentioned : found).slice(0, 4));
  if (products.length === 0) return null;
  return {
    type: "recommendations",
    intro: text,
    explanation: "Prices and stock come from our live catalog. Always check labels for allergens.",
    products,
  };
}

/** Minimal JSON schema export for OpenAI tools from Zod objects. */
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const properties: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(shape)) {
      properties[key] = zodTypeToJson(val);
    }
    return { type: "object", properties, additionalProperties: false };
  }
  return { type: "object", properties: {}, additionalProperties: false };
}

function zodTypeToJson(field: z.ZodType): Record<string, unknown> {
  const described = field.description ? { description: field.description } : {};
  if (field instanceof z.ZodString) return { type: "string", ...described };
  if (field instanceof z.ZodNumber) return { type: "number", ...described };
  if (field instanceof z.ZodBoolean) return { type: "boolean", ...described };
  if (field instanceof z.ZodArray)
    return { type: "array", items: { type: "string" }, ...described };
  if (field instanceof z.ZodOptional || field instanceof z.ZodDefault) {
    return { ...zodTypeToJson(field._def.innerType as z.ZodType), ...described };
  }
  return { type: "string", ...described };
}
