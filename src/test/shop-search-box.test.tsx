import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchBox } from "@/components/shop/search-box";
import { ShopFiltersProvider } from "@/components/shop/shop-filters-provider";

const pushMock = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentParams,
}));

function renderSearch(query: string) {
  currentParams = new URLSearchParams(query);
  return render(
    <ShopFiltersProvider>
      <SearchBox />
    </ShopFiltersProvider>,
  );
}

describe("Shop SearchBox", () => {
  beforeEach(() => pushMock.mockReset());

  it("searches within the shop and keeps the selected aisle", () => {
    renderSearch("category=Fruits&page=3");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search the shop" }), {
      target: { value: "  apple " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(pushMock).toHaveBeenCalledWith("/shop?q=apple&category=Fruits");
  });

  it("prefills the current search and clears it", () => {
    renderSearch("q=milk&sort=newest");
    expect(screen.getByRole("searchbox", { name: "Search the shop" })).toHaveValue("milk");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(pushMock).toHaveBeenCalledWith("/shop?sort=newest");
  });

  it("hides the clear button when there is no search", () => {
    renderSearch("");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });
});
