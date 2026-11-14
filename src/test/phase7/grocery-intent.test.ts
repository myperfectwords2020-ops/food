import { describe, expect, it } from "vitest";

import { parseGroceryIntent } from "@/modules/ai/orchestrator/heuristic-orchestrator";
import { getRecommendationsSchema, searchProductsSchema } from "@/modules/ai/tools/tool-schemas";

describe("grocery intent parsing (offline assistant fallback)", () => {
  it("treats order-status questions as order intent", () => {
    expect(parseGroceryIntent("Where is my order?").kind).toBe("order");
    expect(parseGroceryIntent("Can you track my delivery").kind).toBe("order");
  });

  it("does not treat buying intent as an order-status question", () => {
    expect(parseGroceryIntent("I want to order some apples").kind).toBe("discover");
  });

  it("extracts product keywords for comparisons", () => {
    const intent = parseGroceryIntent("Compare apples and bananas");
    expect(intent.kind).toBe("compare");
    expect(intent.keywords).toEqual(["apples", "bananas"]);
  });

  it("maps dietary tags, use cases, and aisles", () => {
    expect(parseGroceryIntent("Show me vegan snacks")).toMatchObject({
      dietary: "Vegan",
      useCase: "Snacking",
      category: "Snacks & Sweets",
    });
    expect(parseGroceryIntent("What can I make for breakfast?").useCase).toBe("Breakfast");
    expect(parseGroceryIntent("Recommend gluten-free groceries").dietary).toBe("Gluten-free");
    expect(parseGroceryIntent("fresh fruits please").category).toBe("Fruits");
  });
});

describe("assistant tool schemas", () => {
  it("describes grocery meanings of the tag fields for the model", () => {
    const tag = getRecommendationsSchema.shape.skinType.unwrap();
    const useCase = searchProductsSchema.shape.concern.unwrap();
    expect(tag.description).toMatch(/Vegan/);
    expect(useCase.description).toMatch(/Breakfast/);
  });
});
