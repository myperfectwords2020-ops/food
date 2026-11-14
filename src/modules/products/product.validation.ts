import { z } from "zod";

const productImageSchema = z.object({
  url: z.string().url(),
  storageKey: z.string().min(1).optional(),
});

export const adminProductInputSchema = z
  .object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(120),
    category: z.string().min(1).max(80),
    description: z.string().min(1).max(10000),
    price: z.coerce.number().min(0),
    image: z.string().url().optional(),
    images: z.array(productImageSchema).min(1).max(8).optional(),
    concern: z.string().min(1).max(120),
    skinTypes: z.array(z.string().min(1)).min(1),
    ingredients: z.array(z.string().min(1)).min(1),
    stock: z.coerce.number().int().min(0),
    status: z.enum(["active", "draft", "archived"]),
    usageInstructions: z.string().min(1).max(5000),
    warnings: z.string().min(1).max(5000),
    badge: z.string().max(80).optional(),
    relatedProductIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    const hasImages = (value.images?.length ?? 0) > 0 || Boolean(value.image);
    if (!hasImages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one product image.",
        path: ["images"],
      });
    }
  });

function normalizedProductImages(value: {
  image?: string | undefined;
  images?: z.infer<typeof productImageSchema>[] | undefined;
}): z.infer<typeof productImageSchema>[] {
  if (value.images?.length) return value.images;
  if (value.image) return [{ url: value.image }];
  return [];
}

export function parseAdminProductInput(raw: z.input<typeof adminProductInputSchema>) {
  const parsed = adminProductInputSchema.parse(raw);
  const images = normalizedProductImages(parsed);
  return { ...parsed, images, image: images[0]?.url ?? "" };
}

export type AdminProductInput = z.infer<typeof adminProductInputSchema>;

/** Parse comma-separated admin form fields into arrays. */
export function parseAdminProductForm(raw: {
  skinTypes: string;
  ingredients: string;
  relatedProductIds?: string | undefined;
}) {
  return {
    skinTypes: raw.skinTypes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ingredients: raw.ingredients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    relatedProductIds: raw.relatedProductIds
      ? raw.relatedProductIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}
