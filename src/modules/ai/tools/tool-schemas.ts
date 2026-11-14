import { z } from "zod";

const dietaryTag = z
  .string()
  .trim()
  .max(80)
  .describe("Dietary tag, e.g. Vegan, Vegetarian, Gluten-free, Organic, High protein");
const useCase = z
  .string()
  .trim()
  .max(80)
  .describe("Use case, e.g. Breakfast, Snacking, Everyday cooking, Healthy eating, Desserts");

export const searchProductsSchema = z.object({
  query: z.string().trim().max(200).describe("Keyword such as a product name").optional(),
  skinType: dietaryTag.optional(),
  concern: useCase.optional(),
  category: z
    .string()
    .trim()
    .max(80)
    .describe(
      "Aisle: Fruits, Vegetables, Meat & Fish, Milk & Dairy, Bread & Bakery, Drinks, Snacks & Sweets",
    )
    .optional(),
  page: z.coerce.number().int().min(1).max(10).default(1),
  pageSize: z.coerce.number().int().min(1).max(12).default(6),
});

export const getProductDetailsSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export const compareProductsSchema = z.object({
  slugs: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
});

export const getRecommendationsSchema = z.object({
  skinType: dietaryTag.optional(),
  concern: useCase.optional(),
  goals: z.string().trim().max(120).optional(),
  preferences: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(80).optional(),
  currentRoutine: z.string().trim().max(120).optional(),
});

export const addProductToCartSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export const getOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
});

export const getOrderDetailsSchema = z.object({
  orderId: z.string().cuid(),
});

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().max(40).optional(),
  concern: z.string().trim().max(200).optional(),
  interest: z.string().trim().max(200).optional(),
});

export const createRecommendationSchema = getRecommendationsSchema;
