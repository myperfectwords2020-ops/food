import { prisma } from "@/lib/db/prisma";
import { listPublicProducts } from "@/modules/catalog/public-catalog.service";
import { getCompatibilityNotes } from "@/modules/recommendations/product-compatibility.service";
import { rankProducts } from "@/modules/recommendations/recommendation.engine";
import type { RoutineAnswers, RoutineRecommendation } from "@/types/commerce";

const GUIDANCE =
  "These suggestions are based on your preferences and product information only. They are not a medical diagnosis or treatment plan. Patch test new products and consult a professional for persistent skin concerns.";

export async function recommendRoutine(answers: RoutineAnswers): Promise<RoutineRecommendation> {
  const { items } = await listPublicProducts({ pageSize: 50 });
  const ranked = rankProducts(items, answers);
  const products = ranked
    .filter((r) => r.score > 0)
    .slice(0, 4)
    .map((r) => r.product);
  const fallback = ranked.slice(0, 4).map((r) => r.product);
  const chosen = products.length >= 2 ? products : fallback;

  const compatibility = getCompatibilityNotes(chosen);

  return {
    products: chosen,
    morningSteps: [
      "Cleanse with a gentle formula suited to your skin type.",
      "Apply a treatment serum aligned with your priority concern.",
      "Moisturize to support your barrier.",
      "Finish with broad-spectrum SPF every morning.",
      ...compatibility,
    ],
    eveningSteps: [
      "Cleanse to remove the day.",
      "Treat with your chosen active (introduce slowly).",
      "Moisturize to seal in hydration.",
    ],
    guidanceNote: GUIDANCE,
  };
}

export async function persistCustomerRecommendation(input: {
  tenantId: string;
  customerId: string;
  profile: RoutineAnswers;
  scored: { productId: string; score: number; reasons: string[] }[];
}) {
  await prisma.customerRecommendation.create({
    data: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      profile: input.profile,
      results: input.scored,
    },
  });
}
