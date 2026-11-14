import type { Product } from "@/types/commerce";

/** Foundation for ingredient/routine conflict rules — expand with catalog metadata over time. */
export function getCompatibilityNotes(products: Product[]): string[] {
  const notes: string[] = [];
  const hasSpf = products.some((p) => p.category.toLowerCase() === "sunscreen");
  const hasExfoliant = products.some((p) => p.category.toLowerCase() === "toner");

  if (!hasSpf) {
    notes.push("Include broad-spectrum SPF in your morning routine when using daytime actives.");
  }
  if (hasExfoliant) {
    notes.push(
      "Introduce exfoliating steps gradually and avoid combining multiple strong actives at once.",
    );
  }
  return notes;
}
