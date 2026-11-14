import { RecommendationWeights as W } from "@/modules/recommendations/scoring.config";
import type { Product, RoutineAnswers } from "@/types/commerce";

export type RecommendationProfile = RoutineAnswers;

export type ScoredProduct = {
  product: Product;
  score: number;
  reasons: string[];
};

function budgetRange(budget: string): { min: number; max: number } | null {
  const b = budget.toLowerCase();
  if (b.includes("under")) return { min: 0, max: 40000 };
  if (b.includes("40k") && b.includes("70k")) return { min: 40000, max: 70000 };
  if (b.includes("70k") && b.includes("100k")) return { min: 70000, max: 100000 };
  return null;
}

export function scoreProduct(product: Product, answers: RecommendationProfile): ScoredProduct {
  let score = 0;
  const reasons: string[] = [];
  const tagToken = answers.skinType.trim().toLowerCase().split(" ")[0] ?? "";
  const concernToken = answers.concern.trim().toLowerCase().split(" ")[0] ?? "";

  if (tagToken && product.skinTypes.some((t) => t.toLowerCase().includes(tagToken))) {
    score += W.skinTypeMatch;
    reasons.push(`Matches ${answers.skinType.trim()}`);
  }
  if (tagToken && product.skinTypes.some((t) => t.toLowerCase() === "all skin types")) {
    score += W.allSkinTypes;
  }

  if (concernToken && product.concern.toLowerCase().includes(concernToken)) {
    score += W.primaryConcern;
    reasons.push(`Good for ${answers.concern.trim()}`);
  }

  const range = budgetRange(answers.budget);
  if (range && product.price >= range.min && product.price <= range.max) {
    score += W.budgetMatch;
    reasons.push("Fits selected budget");
  } else if (answers.budget.toLowerCase().includes("flexible")) {
    score += 1;
  }

  if (answers.preferences.toLowerCase().includes("fragrance") && product.category === "Cleanser") {
    score += W.fragrancePreference;
  }

  if (answers.goals.toLowerCase().includes("radiance") && product.category === "Serum") {
    score += W.goalSerum;
    reasons.push("Supports radiance goal");
  }
  if (answers.goals.toLowerCase().includes("hydration") && product.category === "Moisturizer") {
    score += W.goalMoisturizer;
    reasons.push("Supports hydration goal");
  }

  if (product.badge) score += W.featured;

  return { product, score, reasons: reasons.slice(0, 3) };
}

export function rankProducts(products: Product[], answers: RecommendationProfile): ScoredProduct[] {
  return [...products]
    .map((p) => scoreProduct(p, answers))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
}
