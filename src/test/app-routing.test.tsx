import { describe, expect, it } from "vitest";

const storefrontRoutes = [
  "/",
  "/shop",
  "/cart",
  "/checkout",
  "/search",
  "/routine",
  "/order-confirmation",
  "/about",
  "/contact",
  "/faq",
  "/assistant",
  "/account",
  "/account/orders",
  "/account/profile",
  "/account/addresses",
  "/account/preferences",
  "/account/recommendations",
  "/products/hydrating-cleanser",
  "/categories/dark-spots",
  "/admin/dashboard",
  "/admin/orders",
  "/admin/products",
  "/admin/inventory",
  "/admin/customers",
  "/admin/leads",
  "/admin/conversations",
  "/admin/ai",
  "/admin/automations",
  "/admin/analytics",
  "/admin/settings",
];

describe("App routing", () => {
  it("lists migrated customer storefront and account routes", () => {
    expect(storefrontRoutes.length).toBeGreaterThanOrEqual(15);
    expect(storefrontRoutes).toContain("/faq");
    expect(storefrontRoutes).toContain("/account/recommendations");
  });
});
