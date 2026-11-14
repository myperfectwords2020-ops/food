/** Demo shade swatches for color-cosmetic seed SKUs (no separate variant SKUs in DB yet). */

export type ProductShade = { name: string; hex: string };

const bySlug: Record<string, ProductShade[]> = {
  "velvet-matte-lipstick": [
    { name: "Nude Rose", hex: "#c47a72" },
    { name: "Berry Crush", hex: "#8b2e4a" },
    { name: "Cocoa Cashmere", hex: "#6b3d2e" },
    { name: "Rosewood", hex: "#a8545b" },
  ],
  "satin-touch-foundation": [
    { name: "Linen 210", hex: "#e8c4a8" },
    { name: "Honey 320", hex: "#c99a6d" },
    { name: "Espresso 510", hex: "#5c3a28" },
    { name: "Walnut 620", hex: "#3d2618" },
  ],
  "candlelit-cream-blush": [
    { name: "Soft Peony", hex: "#e8a0a8" },
    { name: "Warm Apricot", hex: "#e0986a" },
    { name: "Berry Flush", hex: "#b84d62" },
  ],
};

export function shadeOptionsForProduct(slug: string): ProductShade[] | undefined {
  const shades = bySlug[slug];
  return shades?.length ? shades : undefined;
}
