import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/analytics-events", () => ({
  recordStorefrontAddToCartAction: vi.fn(async () => ({ ok: true })),
  recordAssistantAddToCartAction: vi.fn(async () => ({ ok: true })),
}));

import { ProductCard } from "@/components/product-card";
import { renderWithProviders } from "@/test/test-utils";

const product = {
  id: "p1",
  slug: "red-apples",
  name: "Red Apples",
  category: "Fruits",
  description: "Crisp apples",
  price: 3500,
  image: "/test.jpg",
  concern: "Snacking",
  skinTypes: ["Vegan"],
  ingredients: ["Apple"],
  stock: 10,
};

describe("ProductCard", () => {
  it("renders product name, category, price, and stock", () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByRole("heading", { level: 3, name: product.name })).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText(/₦/)).toBeInTheDocument();
    expect(screen.getByText("10 in stock")).toBeInTheDocument();
  });

  it("names the add button after the product", () => {
    renderWithProviders(<ProductCard product={product} />);
    const button = screen.getByRole("button", { name: "Add Red Apples to cart" });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Add");
  });

  it("shows the badge when present", () => {
    renderWithProviders(<ProductCard product={{ ...product, badge: "Sale 10%" }} />);
    expect(screen.getByText("Sale 10%")).toBeInTheDocument();
  });

  it("disables add when out of stock", () => {
    renderWithProviders(<ProductCard product={{ ...product, stock: 0 }} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Red Apples to cart" })).toBeDisabled();
  });
});
