import type { AssistantMessageContent, AssistantProductRef } from "@/types/assistant";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { executeTool } from "@/modules/ai/tools/execute-tool";

type ProductSummary = { slug: string; name: string };
type RankedRow = { card: AssistantProductRef };

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\bfruits?\b|\bberr(y|ies)\b/, "Fruits"],
  [/\bveg(gie|gies|etables?)?\b|\bgreens\b/, "Vegetables"],
  [/\bmeat\b|\bfish\b|\bseafood\b|\bchicken\b/, "Meat & Fish"],
  [/\bdairy\b|\bcheese\b|\byogh?urt\b/, "Milk & Dairy"],
  [/\bbak(ery|ed)\b|\bpastr(y|ies)\b|\bcakes?\b/, "Bread & Bakery"],
  [/\bdrinks?\b|\bbeverages?\b|\bjuices?\b/, "Drinks"],
  [/\bsnacks?\b|\bsweets?\b|\bcandy\b/, "Snacks & Sweets"],
];

const DIETARY_KEYWORDS: [RegExp, string][] = [
  [/\bvegan\b|\bplant[- ]based\b/, "Vegan"],
  [/\bvegetarian\b/, "Vegetarian"],
  [/\bgluten[- ]?free\b|\bcoeliac\b|\bceliac\b/, "Gluten-free"],
  [/\borganic\b/, "Organic"],
  [/\bhigh[- ]protein\b|\bprotein\b/, "High protein"],
];

const USE_CASE_KEYWORDS: [RegExp, string][] = [
  [/\bbreakfast\b|\bmorning\b/, "Breakfast"],
  [/\bsnack(s|ing)?\b/, "Snacking"],
  [/\bdesserts?\b|\bbak(e|ing)\b/, "Desserts"],
  [/\bhealthy\b|\bdiet\b|\blight\b/, "Healthy eating"],
  [
    /\bcook(ing)?\b|\bdinner\b|\blunch\b|\bstew\b|\bsoup\b|\bmeals?\b|\brecipes?\b/,
    "Everyday cooking",
  ],
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "some",
  "any",
  "what",
  "which",
  "can",
  "you",
  "have",
  "need",
  "want",
  "show",
  "find",
  "get",
  "buy",
  "please",
  "compare",
  "versus",
  "between",
  "recommend",
  "suggest",
  "good",
  "best",
  "fresh",
  "cheap",
  "items",
  "products",
  "product",
  "something",
  "help",
  "me",
  "my",
  "is",
  "are",
  "do",
  "does",
  "how",
  "much",
  "price",
  "of",
  "a",
  "an",
  "to",
  "in",
  "on",
  "it",
  "i",
  "im",
  "ideas",
  "idea",
  "make",
  "today",
  "tonight",
  "family",
]);

function firstMatch(text: string, table: [RegExp, string][]): string | undefined {
  return table.find(([pattern]) => pattern.test(text))?.[1];
}

export type GroceryIntent = {
  kind: "order" | "compare" | "discover";
  category?: string;
  dietary?: string;
  useCase?: string;
  keywords: string[];
};

/** Deterministic keyword parsing used when the LLM provider is unavailable. */
export function parseGroceryIntent(message: string): GroceryIntent {
  const lower = message.toLowerCase();
  const kind =
    /\btrack(ing)?\b|\bmy (last |recent )?orders?\b|\border (status|number)\b|\bwhere('s| is)? my\b/.test(
      lower,
    )
      ? "order"
      : /\bcompare\b|\bvs\.?\b|\bversus\b|\bdifference\b/.test(lower)
        ? "compare"
        : "discover";

  const keywords = lower
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .slice(0, 4);

  const intent: GroceryIntent = { kind, keywords };
  const category = firstMatch(lower, CATEGORY_KEYWORDS);
  const dietary = firstMatch(lower, DIETARY_KEYWORDS);
  const useCase = firstMatch(lower, USE_CASE_KEYWORDS);
  if (category) intent.category = category;
  if (dietary) intent.dietary = dietary;
  if (useCase) intent.useCase = useCase;
  return intent;
}

async function toRefs(products: ProductSummary[], reason: string): Promise<AssistantProductRef[]> {
  const { getPublicProductBySlug } = await import("@/modules/catalog/public-catalog.service");
  const refs: AssistantProductRef[] = [];
  for (const p of products) {
    const full = await getPublicProductBySlug(p.slug);
    if (!full) continue;
    refs.push({
      productId: full.id,
      slug: full.slug,
      name: full.name,
      image: full.image,
      displayPrice: full.price,
      category: full.category,
      concern: full.concern,
      reason,
    });
  }
  return refs;
}

async function search(
  input: { query?: string; category?: string; skinType?: string; concern?: string },
  pageSize: number,
  ctx: AiToolContext,
): Promise<ProductSummary[]> {
  const result = (await executeTool("searchProducts", { ...input, pageSize }, ctx)) as {
    products: ProductSummary[];
  };
  return result.products;
}

/** Find products matching any of the free-text keywords, de-duplicated, in keyword order. */
async function searchByKeywords(
  keywords: string[],
  perKeyword: number,
  ctx: AiToolContext,
): Promise<ProductSummary[]> {
  const seen = new Set<string>();
  const found: ProductSummary[] = [];
  for (const keyword of keywords) {
    const singular = keyword.endsWith("es") ? keyword.slice(0, -2) : keyword.replace(/s$/, "");
    for (const p of await search({ query: singular }, perKeyword, ctx)) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      found.push(p);
    }
  }
  return found;
}

export async function runHeuristicTurn(
  userMessage: string,
  ctx: AiToolContext,
): Promise<AssistantMessageContent> {
  const intent = parseGroceryIntent(userMessage);

  if (intent.kind === "order") {
    if (ctx.role === "ANONYMOUS") {
      return {
        type: "text",
        text: "Sign in to your account to see order status and details securely. I can't access orders without authentication.",
      };
    }
    const recent = (await executeTool("listRecentOrders", {}, ctx)) as {
      orders: { id: string; orderNumber: string; status: string }[];
    };
    if (recent.orders.length === 0) {
      return {
        type: "text",
        text: "You don't have any orders yet. Fill your basket from the shop whenever you're ready—checkout runs through secure payment.",
      };
    }
    const lines = recent.orders
      .map((o) => `${o.orderNumber}: ${o.status.replaceAll("_", " ").toLowerCase()}`)
      .join("\n");
    return {
      type: "text",
      text: `Your recent orders:\n${lines}\n\nOpen Account → Orders for full details. I can't change orders or payments from chat.`,
    };
  }

  if (intent.kind === "compare") {
    let candidates = await searchByKeywords(intent.keywords, 1, ctx);
    if (candidates.length < 2 && intent.category) {
      candidates = await search({ category: intent.category }, 2, ctx);
    }
    const products = await toRefs(candidates.slice(0, 4), "Catalog comparison");
    if (products.length < 2) {
      return {
        type: "text",
        text: "I couldn't find two matching products to compare. Try naming two items, for example “compare apples and bananas”.",
      };
    }
    return {
      type: "comparison",
      summary: "Side-by-side view using our current catalog prices and details.",
      products,
    };
  }

  if (intent.dietary || intent.useCase) {
    const rec = (await executeTool(
      "getRecommendations",
      {
        ...(intent.dietary ? { skinType: intent.dietary } : {}),
        ...(intent.useCase ? { concern: intent.useCase } : {}),
      },
      ctx,
    )) as { ranked: RankedRow[] };
    const products = rec.ranked.map((r) => r.card).slice(0, 4);
    if (products.length) {
      const focus = [intent.dietary, intent.useCase?.toLowerCase()].filter(Boolean).join(" ");
      return {
        type: "recommendations",
        intro: `Here are some ${focus} picks from our shelves:`,
        explanation:
          "Ranked from in-stock catalog items. Always check labels for allergens and dietary details.",
        products,
      };
    }
  }

  let matches = intent.category ? await search({ category: intent.category }, 4, ctx) : [];
  if (matches.length === 0) matches = await searchByKeywords(intent.keywords, 2, ctx);

  if (matches.length === 0) {
    const fallback = await search({}, 4, ctx);
    const products = await toRefs(fallback, "Popular right now");
    if (products.length === 0) {
      return { type: "text", text: "I couldn't find available products right now." };
    }
    return {
      type: "recommendations",
      intro:
        "I couldn't find an exact match for that, but here are some popular items. Try a product name like “milk” or an aisle like “vegetables”.",
      explanation: "Shown from our current catalog.",
      products,
    };
  }

  return {
    type: "recommendations",
    intro: "Here's what I found on our shelves:",
    explanation: "Prices and stock come from our live catalog.",
    products: await toRefs(matches.slice(0, 4), "Matched your search"),
  };
}
