const COLOR_CATEGORIES = new Set([
  "Lipstick",
  "Foundation",
  "Blush",
  "Mascara",
  "Eyeshadow",
  "Concealer",
]);

const FRAGRANCE_CATEGORIES = new Set(["Fragrance", "Body Mist"]);

export function isColorCosmeticCategory(category: string): boolean {
  return COLOR_CATEGORIES.has(category);
}

export function isFragranceCategory(category: string): boolean {
  return FRAGRANCE_CATEGORIES.has(category);
}

export function isSkincareCategory(category: string): boolean {
  return !isColorCosmeticCategory(category) && !isFragranceCategory(category);
}
