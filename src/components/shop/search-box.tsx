"use client";

import { Search as SearchIcon, X } from "lucide-react";

import { useShopFilters } from "@/components/shop/shop-filters-provider";

export function SearchBox() {
  const { filters, applyFilters } = useShopFilters();
  const current = filters.q ?? "";

  return (
    <form
      key={current}
      className="gc-search shop-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        applyFilters({ q: value || undefined });
      }}
    >
      <label className="sr-only" htmlFor="shop-search">
        Search the shop
      </label>
      <input
        id="shop-search"
        name="q"
        type="search"
        defaultValue={current}
        placeholder="Search for fruits, vegetables, dairy..."
      />
      {current ? (
        <button
          type="button"
          className="shop-search-clear"
          aria-label="Clear search"
          onClick={() => applyFilters({ q: undefined })}
        >
          <X size={16} aria-hidden />
        </button>
      ) : null}
      <button type="submit" aria-label="Search">
        <SearchIcon size={16} aria-hidden />
      </button>
    </form>
  );
}
