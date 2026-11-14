import { createLead } from "@/modules/leads/lead.service";
import { persistCustomerRecommendation } from "@/modules/recommendations/routine-recommendation.service";
import { rankProducts } from "@/modules/recommendations/recommendation.engine";
import { listPublicProducts } from "@/modules/catalog/public-catalog.service";
import { requireCustomerToolContext } from "@/modules/ai/tools/tool-auth";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { createLeadSchema, createRecommendationSchema } from "@/modules/ai/tools/tool-schemas";
import { getCustomerForUser } from "@/modules/customers/customer-access.service";
import type { RoutineAnswers } from "@/types/commerce";

export async function createLeadHandler(input: unknown, ctx: AiToolContext) {
  const parsed = createLeadSchema.parse(input);
  if (!parsed.email && !parsed.phone) {
    return { ok: false as const, error: "Email or phone required for lead capture." };
  }
  const lead = await createLead({
    tenantId: ctx.tenantId,
    source: "AI_ASSISTANT",
    name: parsed.name,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    concern: parsed.concern ?? null,
    interest: parsed.interest ?? null,
    actorUserId: ctx.userId ?? null,
  });
  return { ok: true as const, leadId: lead.id };
}

export async function createRecommendationHandler(input: unknown, ctx: AiToolContext) {
  const customerCtx = requireCustomerToolContext(ctx);
  const parsed = createRecommendationSchema.parse(input);
  const answers: RoutineAnswers = {
    skinType: parsed.skinType ?? "",
    concern: parsed.concern ?? "",
    goals: parsed.goals ?? "",
    preferences: parsed.preferences ?? "",
    budget: parsed.budget ?? "",
    currentRoutine: parsed.currentRoutine ?? "",
  };
  const customer = await getCustomerForUser(customerCtx);
  const { items } = await listPublicProducts({ pageSize: 50 });
  const scored = rankProducts(items, answers)
    .slice(0, 6)
    .map((r) => ({
      productId: r.product.id,
      score: r.score,
      reasons: r.reasons,
    }));
  await persistCustomerRecommendation({
    tenantId: ctx.tenantId,
    customerId: customer.id,
    profile: answers,
    scored,
  });
  return { ok: true as const, savedCount: scored.length };
}
