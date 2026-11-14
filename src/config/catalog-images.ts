/** Public catalog imagery (from `public/grocery/`). Used by seed data and storefront fallbacks. */

const byCategory: Record<string, string> = {
  "Bread & Bakery": "/grocery/bread.jpg",
  Fruits: "/grocery/apple.jpg",
  Vegetables: "/grocery/broccoli.jpg",
  "Meat & Fish": "/grocery/salmon.jpg",
  Drinks: "/grocery/orange-juice.jpg",
  "Milk & Dairy": "/grocery/milk.jpg",
  "Snacks & Sweets": "/grocery/chocolate.jpg",
};

const bySlug: Record<string, string> = {
  "fresh-atlantic-salmon": "/grocery/salmon.jpg",
  "grass-fed-beef-steak": "/grocery/beef.jpg",
  "red-bell-pepper": "/grocery/bell-pepper.jpg",
  "fresh-carrots": "/grocery/carrot.jpg",
  "green-broccoli": "/grocery/broccoli.jpg",
  "vine-tomatoes": "/grocery/tomato.jpg",
  "irish-potatoes": "/grocery/potato.jpg",
  "sweet-pumpkin": "/grocery/pumpkin.jpg",
  "red-apples": "/grocery/apple.jpg",
  "ripe-bananas": "/grocery/banana.jpg",
  "fresh-strawberries": "/grocery/strawberry.jpg",
  "hass-avocado": "/grocery/avocado.jpg",
  "sourdough-bread": "/grocery/bread.jpg",
  "vanilla-cupcakes": "/grocery/cupcake.jpg",
  "whole-milk": "/grocery/milk.jpg",
  "farm-fresh-eggs": "/grocery/eggs.jpg",
  "orange-juice": "/grocery/orange-juice.jpg",
  "almond-milk-chocolate": "/grocery/chocolate.jpg",
};

export const DEFAULT_CATALOG_IMAGE = "/grocery/apple.jpg";

export function catalogImageForProduct(slug: string, category?: string): string {
  return bySlug[slug] ?? (category ? byCategory[category] : undefined) ?? DEFAULT_CATALOG_IMAGE;
}
