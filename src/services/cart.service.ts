import type { CartLine, CartLineInput, CartSummary } from "@/types/commerce";

import type { CatalogService } from "./catalog.service";

const STANDARD_DELIVERY_FEE = 3500;

export async function buildCartSummary(
  catalog: CatalogService,
  lines: CartLineInput[],
  options?: { includeDelivery?: boolean },
): Promise<CartSummary> {
  const cartLines: CartLine[] = [];

  for (const line of lines) {
    if (line.quantity < 1) continue;
    const product = await catalog.getProductById(line.productId);
    if (!product) continue;
    const quantity = Math.min(line.quantity, product.stock);
    cartLines.push({
      productId: product.id,
      quantity,
      name: product.name,
      slug: product.slug,
      image: product.image,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
      maxQuantity: product.stock,
    });
  }

  const subtotal = cartLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const delivery = options?.includeDelivery ? (subtotal > 0 ? STANDARD_DELIVERY_FEE : null) : null;
  const discount = 0;
  const total = subtotal + (delivery ?? 0) - discount;

  return {
    lines: cartLines,
    subtotal,
    delivery,
    discount,
    total,
    currency: "NGN",
  };
}
