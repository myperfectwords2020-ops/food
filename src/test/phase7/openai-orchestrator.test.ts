import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { executeTool, runHeuristicTurn } = vi.hoisted(() => ({
  executeTool: vi.fn(),
  runHeuristicTurn: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getEnv: () => ({ AI_API_KEY: "test-key" }) }));
vi.mock("@/modules/ai/tools/execute-tool", () => ({ executeTool }));
vi.mock("@/modules/ai/orchestrator/heuristic-orchestrator", () => ({ runHeuristicTurn }));
vi.mock("@/modules/catalog/public-catalog.service", () => ({
  getPublicProductBySlug: vi.fn(async (slug: string) => ({
    id: `id-${slug}`,
    slug,
    name: slug === "whole-milk" ? "Whole Milk 1L" : "Farm Fresh Eggs",
    category: "Milk & Dairy",
    description: "",
    price: 1900,
    image: "/x.jpg",
    concern: "Breakfast",
    skinTypes: [],
    ingredients: [],
    stock: 5,
  })),
}));

import { runOpenAiTurn, toPlainAssistantText } from "@/modules/ai/providers/openai-orchestrator";

describe("toPlainAssistantText", () => {
  it("strips model markdown images, links, bold, and headings", () => {
    const raw =
      "### Your list\n\n1. **Vine Tomatoes** - ₦1500\n   ![Vine Tomatoes](https://example.com/tomato.jpg)\n\n\n\nSee [our shop](https://evil.test).";
    expect(toPlainAssistantText(raw)).toBe(
      "Your list\n\n1. Vine Tomatoes - ₦1500\n\nSee our shop.",
    );
  });
});

const ctx = {
  tenantId: "t1",
  conversationId: "c1",
  requestId: "r1",
  role: "ANONYMOUS" as const,
};

type SentBody = { messages: { role: string; tool_calls?: unknown; tool_call_id?: string }[] };

function completion(message: Record<string, unknown>) {
  return new Response(JSON.stringify({ choices: [{ message }] }), { status: 200 });
}

describe("OpenAI orchestrator tool loop", () => {
  const sent: SentBody[] = [];

  beforeEach(() => {
    sent.length = 0;
    executeTool.mockReset().mockResolvedValue({ products: [] });
    runHeuristicTurn.mockReset().mockResolvedValue({ type: "text", text: "fallback" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("echoes tool_calls on the assistant message so tool results are accepted", async () => {
    const toolCalls = [
      { id: "call_1", type: "function", function: { name: "searchProducts", arguments: "{}" } },
    ];
    const replies = [
      completion({ content: null, tool_calls: toolCalls }),
      completion({ content: "We have fresh milk in stock." }),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body)) as SentBody;
        sent.push(body);
        const assistant = body.messages.find((m) => m.role === "assistant");
        if (body.messages.some((m) => m.role === "tool") && !assistant?.tool_calls) {
          return new Response(JSON.stringify({ error: { message: "missing tool_calls" } }), {
            status: 400,
          });
        }
        return replies.shift()!;
      }),
    );

    const result = await runOpenAiTurn("find me milk", ctx);

    expect(runHeuristicTurn).not.toHaveBeenCalled();
    expect(result).toEqual({ type: "text", text: "We have fresh milk in stock." });
    const followUp = sent[1]!;
    expect(followUp.messages.find((m) => m.role === "assistant")?.tool_calls).toEqual(toolCalls);
    expect(followUp.messages.find((m) => m.role === "tool")?.tool_call_id).toBe("call_1");
  });

  it("turns search results into cart-ready cards for the products the model mentions", async () => {
    executeTool.mockResolvedValue({
      products: [
        { slug: "whole-milk", name: "Whole Milk 1L" },
        { slug: "farm-fresh-eggs", name: "Farm Fresh Eggs" },
      ],
    });
    const replies = [
      completion({
        content: null,
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "searchProducts", arguments: '{"query":"milk"}' },
          },
        ],
      }),
      completion({ content: "Try our Whole Milk 1L for ₦1,900." }),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => replies.shift()!),
    );

    const result = await runOpenAiTurn("find me milk", ctx);

    expect(result.type).toBe("recommendations");
    if (result.type === "recommendations") {
      expect(result.intro).toBe("Try our Whole Milk 1L for ₦1,900.");
      expect(result.products.map((p) => p.productId)).toEqual(["id-whole-milk"]);
    }
  });
});
