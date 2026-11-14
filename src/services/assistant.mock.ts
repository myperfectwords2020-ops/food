import { mockCatalogService } from "@/services/catalog.mock";
import type {
  AssistantChatMessage,
  AssistantConversationStart,
  AssistantCustomerContext,
  AssistantProductRef,
  AssistantSendMessageRequest,
  AssistantSendMessageResult,
} from "@/types/assistant";

import type { AssistantService } from "./assistant.service";

const DISCLAIMER =
  "My answers come from our live catalog—always check product labels for allergens.";

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

async function toRef(productId: string, reason?: string): Promise<AssistantProductRef | null> {
  const product = await mockCatalogService.getProductById(productId);
  if (!product) return null;
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    displayPrice: product.price,
    category: product.category,
    concern: product.concern,
    ...(reason !== undefined ? { reason } : {}),
  };
}

function textMessage(
  text: string,
  role: AssistantChatMessage["role"] = "assistant",
): AssistantChatMessage {
  return {
    id: id("msg"),
    role,
    createdAt: now(),
    content: { type: "text", text },
  };
}

const SUGGESTED = [
  "What can I make for breakfast?",
  "Show me vegan snacks",
  "Compare apples and bananas",
  "Where is my order?",
];

const QUICK_ACTIONS = [
  { id: "discover", label: "Fresh produce", prompt: "Show me fresh fruits and vegetables" },
  { id: "meal", label: "Meal ideas", prompt: "What do I need for a simple stew tonight?" },
  { id: "dietary", label: "Gluten-free picks", prompt: "Recommend gluten-free groceries" },
  { id: "order", label: "Order status", prompt: "Where is my order?" },
];

export const mockAssistantService: AssistantService = {
  async startConversation(context) {
    const name = context?.customerName ? `, ${context.customerName}` : "";
    const welcome = textMessage(
      `Hello${name}! I'm the Greencart assistant. I can help you find fresh groceries, compare products, plan meals from what's in stock, and check your orders. ${DISCLAIMER} What are you shopping for today?`,
    );
    return {
      conversationId: id("conv"),
      welcome,
      suggestedPrompts: SUGGESTED,
      quickActions: QUICK_ACTIONS,
    };
  },

  async sendMessage(request: AssistantSendMessageRequest): Promise<AssistantSendMessageResult> {
    const trimmed = request.message.trim();
    if (!trimmed) {
      return { ok: false, code: "empty_response", message: "Please enter a message to continue." };
    }

    if (trimmed === "#simulate-timeout") {
      return {
        ok: false,
        code: "timeout",
        message: "The assistant took too long to respond. Please try again.",
      };
    }
    if (trimmed === "#simulate-rate-limit") {
      return {
        ok: false,
        code: "rate_limit",
        message: "You're sending messages quickly. Please wait a moment and try again.",
      };
    }
    if (trimmed === "#simulate-unavailable") {
      return {
        ok: false,
        code: "unavailable",
        message: "The shopping assistant is temporarily unavailable.",
      };
    }

    const lower = trimmed.toLowerCase();

    if (lower.includes("compare")) {
      const catalog = await mockCatalogService.listProducts({ category: "Serum", pageSize: 2 });
      const refs = (
        await Promise.all(
          catalog.items.map((p) => toRef(p.id, "Commonly compared for tone and texture")),
        )
      ).filter((p): p is AssistantProductRef => Boolean(p));
      if (refs.length < 2) {
        return {
          ok: false,
          code: "invalid_recommendation",
          message: "I couldn't build a comparison from the current catalog.",
        };
      }
      return {
        ok: true,
        conversationId: request.conversationId,
        message: {
          id: id("msg"),
          role: "assistant",
          createdAt: now(),
          content: {
            type: "comparison",
            summary:
              "Side-by-side view using product information only. Patch test new formulas and introduce one active at a time.",
            products: refs.slice(0, 2),
          },
        },
      };
    }

    if (lower.includes("order") || lower.includes("tracking")) {
      return {
        ok: true,
        conversationId: request.conversationId,
        message: textMessage(
          "Order updates are available through your account—open Orders to see status and delivery details. I can't change orders or payments from chat; those actions run through secure checkout and account services.",
        ),
      };
    }

    if (
      lower.includes("ingredient") ||
      lower.includes("niacinamide") ||
      lower.includes("vitamin c")
    ) {
      return {
        ok: true,
        conversationId: request.conversationId,
        message: textMessage(
          "Ingredient questions are answered using our published product information—not as medical guidance. For niacinamide or vitamin C, check the Key ingredients section on each product page, or tell me which product name you'd like to explore.",
        ),
      };
    }

    if (lower.includes("routine")) {
      return {
        ok: true,
        conversationId: request.conversationId,
        message: textMessage(
          "For a guided routine based on your preferences, try our routine consultation—it walks through skin type, concerns, and budget, then suggests a calm edit. I can also recommend individual products here if you describe what you'd like to support.",
        ),
      };
    }

    const search = await mockCatalogService.listProducts({
      q: lower.includes("serum") ? "serum" : lower.includes("spf") ? "sun" : "hydrat",
      pageSize: 3,
    });
    const products = (
      await Promise.all(
        search.items.map((p) =>
          toRef(
            p.id,
            "Matched from catalog search based on your message—not a medical recommendation.",
          ),
        ),
      )
    ).filter((p): p is AssistantProductRef => Boolean(p));

    if (products.length === 0) {
      return {
        ok: false,
        code: "product_unavailable",
        message: "I couldn't find available products for that request right now.",
      };
    }

    return {
      ok: true,
      conversationId: request.conversationId,
      message: {
        id: id("msg"),
        role: "assistant",
        createdAt: now(),
        content: {
          type: "recommendations",
          intro: "Here are a few formulas that may fit what you described:",
          explanation:
            "These suggestions use product catalog data and your message only. They are not a diagnosis. Introduce one product at a time and patch test.",
          products,
        },
      },
    };
  },
};
