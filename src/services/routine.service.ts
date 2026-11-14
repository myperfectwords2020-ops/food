import type { Product, RoutineAnswers, RoutineRecommendation } from "@/types/commerce";

import type { CatalogService } from "./catalog.service";

export interface RoutineService {
  recommend(answers: RoutineAnswers): Promise<RoutineRecommendation>;
}

const GUIDANCE =
  "These suggestions are based on your preferences and product information only. They are not a medical diagnosis or treatment plan. Patch test new products and consult a professional for persistent skin concerns.";

function scoreProduct(product: Product, answers: RoutineAnswers): number {
  let score = 0;
  const skin = answers.skinType.toLowerCase();
  const concern = answers.concern.toLowerCase();

  if (product.skinTypes.some((t) => t.toLowerCase().includes(skin.split(" ")[0] ?? skin))) {
    score += 3;
  }
  if (product.skinTypes.some((t) => t.toLowerCase() === "all skin types")) score += 1;
  if (product.concern.toLowerCase().includes(concern.split(" ")[0] ?? concern)) score += 4;
  if (answers.preferences.toLowerCase().includes("fragrance") && product.category === "Cleanser") {
    score += 1;
  }
  if (answers.budget.startsWith("Under") && product.price <= 40000) score += 2;
  if (answers.budget.includes("40k") && product.price >= 40000 && product.price <= 70000)
    score += 2;
  if (answers.budget.includes("70k") && product.price >= 70000) score += 2;
  if (answers.goals.toLowerCase().includes("radiance") && product.category === "Serum") score += 2;
  if (answers.goals.toLowerCase().includes("hydration") && product.category === "Moisturizer")
    score += 2;
  return score;
}

export function createRoutineService(catalog: CatalogService): RoutineService {
  return {
    async recommend(answers) {
      const { items } = await catalog.listProducts({ pageSize: 48 });
      const ranked = [...items].sort((a, b) => scoreProduct(b, answers) - scoreProduct(a, answers));
      const products = ranked.slice(0, 4);

      return {
        products,
        morningSteps: [
          "Cleanse with a gentle formula suited to your skin type.",
          "Apply a treatment serum aligned with your priority concern.",
          "Moisturize to support your barrier.",
          "Finish with broad-spectrum SPF every morning.",
        ],
        eveningSteps: [
          "Cleanse to remove the day.",
          "Treat with your chosen active (introduce slowly).",
          "Moisturize to seal in hydration.",
        ],
        guidanceNote: GUIDANCE,
      };
    },
  };
}
