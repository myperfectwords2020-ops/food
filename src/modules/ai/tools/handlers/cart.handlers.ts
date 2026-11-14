import { getPublicProductBySlug } from "@/modules/catalog/public-catalog.service";
import { setCartItemQuantity } from "@/modules/cart/cart.service";
import { requireCustomerToolContext } from "@/modules/ai/tools/tool-auth";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { addProductToCartSchema } from "@/modules/ai/tools/tool-schemas";
import { ValidationError } from "@/lib/errors/app-error";

export async function addProductToCartHandler(input: unknown, ctx: AiToolContext) {
  const customerCtx = requireCustomerToolContext(ctx);
  const { slug, quantity } = addProductToCartSchema.parse(input);
  const product = await getPublicProductBySlug(slug);
  if (!product) throw new ValidationError("Product not found.");
  if (product.stock < quantity) throw new ValidationError("Not enough stock for that quantity.");

  await setCartItemQuantity(customerCtx, product.id, quantity);
  return {
    ok: true as const,
    slug: product.slug,
    name: product.name,
    quantity,
    message: "Added to your bag using current catalog price and availability.",
  };
}
