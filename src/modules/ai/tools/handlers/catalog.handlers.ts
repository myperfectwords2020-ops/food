import { rankProducts } from "@/modules/recommendations/recommendation.engine";
import {
  getPublicProductBySlug,
  listPublicProducts,
} from "@/modules/catalog/public-catalog.service";
import { toAssistantProductRef, toPublicProductSummary } from "@/modules/ai/tools/product-dto";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import {
  compareProductsSchema,
  getProductDetailsSchema,
  getRecommendationsSchema,
  searchProductsSchema,
} from "@/modules/ai/tools/tool-schemas";
import type { RoutineAnswers } from "@/types/commerce";

export async function searchProductsHandler(input: unknown, ctx: AiToolContext) {
  const parsed = searchProductsSchema.parse(input);
  const filters: import("@/types/commerce").ProductFilters = {
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
  if (parsed.query) filters.q = parsed.query;
  if (parsed.skinType) filters.skinType = parsed.skinType;
  if (parsed.concern) filters.concern = parsed.concern;
  if (parsed.category) filters.category = parsed.category;
  const { items } = await listPublicProducts(filters);
  return {
    tenantId: ctx.tenantId,
    products: items.map((p) => toPublicProductSummary(p)),
  };
}

export async function getProductDetailsHandler(input: unknown, _ctx: AiToolContext) {
  const { slug } = getProductDetailsSchema.parse(input);
  const product = await getPublicProductBySlug(slug);
  if (!product) return { found: false as const };
  return { found: true as const, product: toPublicProductSummary(product) };
}

export async function compareProductsHandler(input: unknown, _ctx: AiToolContext) {
  const { slugs } = compareProductsSchema.parse(input);
  const products = await Promise.all(slugs.map((s) => getPublicProductBySlug(s)));
  const found = products.filter(Boolean);
  return {
    products: found.map((p) => toPublicProductSummary(p!)),
  };
}

export async function getRecommendationsHandler(input: unknown, ctx: AiToolContext) {
  const parsed = getRecommendationsSchema.parse(input);
  const answers: RoutineAnswers = {
    skinType: parsed.skinType ?? "",
    concern: parsed.concern ?? "",
    goals: parsed.goals ?? "",
    preferences: parsed.preferences ?? "",
    budget: parsed.budget ?? "",
    currentRoutine: parsed.currentRoutine ?? "",
  };
  const { items } = await listPublicProducts({ pageSize: 50 });
  const ranked = rankProducts(items, answers).slice(0, 6);
  return {
    tenantId: ctx.tenantId,
    ranked: ranked.map((r) => ({
      product: toPublicProductSummary(r.product),
      score: r.score,
      reasons: r.reasons,
      card: toAssistantProductRef(r.product, r.reasons[0]),
    })),
  };
}
