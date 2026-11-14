import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShopProductGridSkeleton } from "@/components/shop/shop-product-grid-skeleton";

describe("ShopProductGridSkeleton", () => {
  it("renders the requested number of placeholder cards", () => {
    const { container } = render(<ShopProductGridSkeleton count={4} />);
    expect(screen.getByTestId("shop-product-grid-skeleton")).toBeInTheDocument();
    expect(container.querySelectorAll(".product-card")).toHaveLength(4);
  });
});
