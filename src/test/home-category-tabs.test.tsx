import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/analytics-events", () => ({
  recordStorefrontAddToCartAction: vi.fn(async () => ({ ok: true })),
  recordAssistantAddToCartAction: vi.fn(async () => ({ ok: true })),
}));

import { HomeCategoryTabs } from "@/components/home/home-category-tabs";
import { renderWithProviders } from "@/test/test-utils";
import type { Product } from "@/types/commerce";

function product(id: string, name: string, category: string, price: number): Product {
  return {
    id,
    slug: id,
    name,
    category,
    description: "",
    price,
    image: "/test.jpg",
    concern: "Glow",
    skinTypes: ["All"],
    ingredients: [],
    stock: 5,
  };
}

const products = [
  product("a", "Red Apples", "Fruits", 3500),
  product("b", "Whole Milk", "Milk & Dairy", 1900),
  product("c", "Atlantic Salmon", "Meat & Fish", 14500),
];

function headingNames() {
  return screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
}

describe("HomeCategoryTabs", () => {
  it("filters by category pill and marks it pressed", () => {
    renderWithProviders(<HomeCategoryTabs products={products} />);
    const group = screen.getByRole("group", { name: "Filter products" });

    fireEvent.click(within(group).getByRole("button", { name: "Meat & Fish" }));

    expect(within(group).getByRole("button", { name: "Meat & Fish" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(headingNames()).toEqual(["Atlantic Salmon"]);
  });

  it("shows an empty state for an aisle with no products", () => {
    renderWithProviders(<HomeCategoryTabs products={products} />);
    const group = screen.getByRole("group", { name: "Filter products" });

    fireEvent.click(within(group).getByRole("button", { name: "Bakery" }));

    expect(screen.getByText(/No products in this aisle yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse everything" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("cycles price sort ascending then descending", () => {
    renderWithProviders(<HomeCategoryTabs products={products} />);

    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(headingNames()).toEqual(["Whole Milk", "Red Apples", "Atlantic Salmon"]);

    fireEvent.click(screen.getByRole("button", { name: /low to high/i }));
    expect(headingNames()).toEqual(["Atlantic Salmon", "Red Apples", "Whole Milk"]);
  });
});
