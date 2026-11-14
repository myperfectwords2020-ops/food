import { describe, expect, it } from "vitest";

import { rankProducts, scoreProduct } from "@/modules/recommendations/recommendation.engine";
import type { Product, RoutineAnswers } from "@/types/commerce";

const sample: Product = {
  id: "1",
  slug: "serum",
  name: "Test Serum",
  category: "Serum",
  description: "Test",
  price: 18000,
  image: "/x.jpg",
  concern: "Dark Spots",
  skinTypes: ["Combination"],
  ingredients: ["Vitamin C"],
  stock: 5,
};

const answers: RoutineAnswers = {
  skinType: "Combination",
  concern: "Dark spots",
  currentRoutine: "Basics",
  preferences: "Light textures",
  budget: "Under ₦40,000",
  goals: "Support radiance",
};

describe("recommendation engine", () => {
  it("scores matching skin type and concern", () => {
    const scored = scoreProduct(sample, answers);
    expect(scored.score).toBeGreaterThan(4);
    expect(scored.reasons.length).toBeGreaterThan(0);
  });

  it("does not award tag or concern matches when those answers are empty", () => {
    const empty: RoutineAnswers = {
      skinType: "",
      concern: "",
      currentRoutine: "",
      preferences: "",
      budget: "",
      goals: "",
    };
    const scored = scoreProduct(sample, empty);
    expect(scored.score).toBe(0);
    expect(scored.reasons).toEqual([]);
  });

  it("explains grocery matches with dietary and use-case reasons", () => {
    const apples: Product = {
      ...sample,
      id: "apples",
      name: "Red Apples",
      category: "Fruits",
      concern: "Snacking",
      skinTypes: ["Vegan", "Gluten-free"],
    };
    const scored = scoreProduct(apples, { ...answers, skinType: "Vegan", concern: "Snacking" });
    expect(scored.reasons).toContain("Matches Vegan");
    expect(scored.reasons).toContain("Good for Snacking");
  });

  it("is deterministic for same input", () => {
    const a = rankProducts([sample, { ...sample, id: "2", concern: "Dryness" }], answers);
    const b = rankProducts([sample, { ...sample, id: "2", concern: "Dryness" }], answers);
    expect(a.map((x) => x.product.id)).toEqual(b.map((x) => x.product.id));
  });
});
