import type { RegisteredTool } from "@/modules/ai/types/tool-context";
import {
  addProductToCartSchema,
  compareProductsSchema,
  createLeadSchema,
  createRecommendationSchema,
  getProductDetailsSchema,
  getRecommendationsSchema,
  searchProductsSchema,
  getOrderDetailsSchema,
  getOrderStatusSchema,
} from "@/modules/ai/tools/tool-schemas";
import {
  compareProductsHandler,
  getProductDetailsHandler,
  getRecommendationsHandler,
  searchProductsHandler,
} from "@/modules/ai/tools/handlers/catalog.handlers";
import {
  getCustomerPreferencesHandler,
  getCustomerProfileHandler,
  getOrderDetailsHandler,
  getOrderStatusHandler,
  listRecentOrdersHandler,
} from "@/modules/ai/tools/handlers/customer.handlers";
import { addProductToCartHandler } from "@/modules/ai/tools/handlers/cart.handlers";
import {
  createLeadHandler,
  createRecommendationHandler,
} from "@/modules/ai/tools/handlers/crm.handlers";
import { z } from "zod";

export const TOOL_REGISTRY: RegisteredTool[] = [
  {
    name: "searchProducts",
    description: "Search the store's grocery catalog by keyword, aisle, dietary tag, or use case.",
    auth: "public",
    inputSchema: searchProductsSchema,
    handler: searchProductsHandler,
  },
  {
    name: "getProductDetails",
    description: "Get authoritative product information by slug.",
    auth: "public",
    inputSchema: getProductDetailsSchema,
    handler: getProductDetailsHandler,
  },
  {
    name: "compareProducts",
    description: "Compare multiple catalog products by slug.",
    auth: "public",
    inputSchema: compareProductsSchema,
    handler: compareProductsHandler,
  },
  {
    name: "getRecommendations",
    description:
      "Rank in-stock groceries for a dietary tag and/or use case using the deterministic recommendation engine.",
    auth: "public",
    inputSchema: getRecommendationsSchema,
    handler: getRecommendationsHandler,
  },
  {
    name: "getCustomerProfile",
    description: "Get the signed-in customer's profile.",
    auth: "authenticated",
    inputSchema: z.object({}),
    handler: getCustomerProfileHandler,
  },
  {
    name: "getCustomerPreferences",
    description: "Get the signed-in customer's saved shopping preferences.",
    auth: "authenticated",
    inputSchema: z.object({}),
    handler: getCustomerPreferencesHandler,
  },
  {
    name: "getOrderStatus",
    description: "Get status for an order owned by the signed-in customer.",
    auth: "authenticated",
    inputSchema: getOrderStatusSchema,
    handler: getOrderStatusHandler,
  },
  {
    name: "getOrderDetails",
    description: "Get safe order details for the signed-in customer.",
    auth: "authenticated",
    inputSchema: getOrderDetailsSchema,
    handler: getOrderDetailsHandler,
  },
  {
    name: "listRecentOrders",
    description: "List recent orders for the signed-in customer.",
    auth: "authenticated",
    inputSchema: z.object({}),
    handler: listRecentOrdersHandler,
  },
  {
    name: "addProductToCart",
    description: "Add a catalog product to the signed-in customer's cart.",
    auth: "authenticated",
    inputSchema: addProductToCartSchema,
    handler: addProductToCartHandler,
  },
  {
    name: "createLead",
    description: "Capture or update a CRM lead through the lead service.",
    auth: "controlled",
    inputSchema: createLeadSchema,
    handler: createLeadHandler,
  },
  {
    name: "createRecommendation",
    description: "Persist a deterministic recommendation for the signed-in customer.",
    auth: "authenticated",
    inputSchema: createRecommendationSchema,
    handler: createRecommendationHandler,
  },
];

export function getToolByName(name: string): RegisteredTool | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}
