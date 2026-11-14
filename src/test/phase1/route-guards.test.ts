import type { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { evaluateRouteAccess } from "@/lib/auth/route-guards";

describe("route guards (middleware policy)", () => {
  it("redirects unauthenticated users away from account", () => {
    const result = evaluateRouteAccess({
      pathname: "/account/orders",
      isAuthenticated: false,
    });
    expect(result.action).toBe("redirect");
    if (result.action === "redirect") {
      expect(result.url).toContain("/account/login");
      expect(result.url).toContain("callbackUrl");
    }
  });

  it("redirects customers away from admin", () => {
    const result = evaluateRouteAccess({
      pathname: "/admin/products",
      isAuthenticated: true,
      role: "CUSTOMER" as Role,
    });
    expect(result.action).toBe("rewrite");
    if (result.action === "rewrite") {
      expect(result.url).toBe("/access-denied");
    }
  });

  it("allows staff into admin", () => {
    const result = evaluateRouteAccess({
      pathname: "/admin/orders",
      isAuthenticated: true,
      role: "STAFF" as Role,
    });
    expect(result).toEqual({ action: "allow" });
  });

  it("redirects staff away from customer account area", () => {
    const result = evaluateRouteAccess({
      pathname: "/account/profile",
      isAuthenticated: true,
      role: "STAFF" as Role,
    });
    expect(result.action).toBe("redirect");
    if (result.action === "redirect") {
      expect(result.url).toBe("/admin/dashboard");
    }
  });

  it("allows login page without session", () => {
    expect(
      evaluateRouteAccess({
        pathname: "/account/login",
        isAuthenticated: false,
      }),
    ).toEqual({ action: "allow" });
  });

  it("redirects authenticated customers away from login", () => {
    const result = evaluateRouteAccess({
      pathname: "/account/login",
      isAuthenticated: true,
      role: "CUSTOMER",
    });
    expect(result).toEqual({ action: "redirect", url: "/account" });
  });

  it("redirects authenticated staff away from register", () => {
    const result = evaluateRouteAccess({
      pathname: "/account/register",
      isAuthenticated: true,
      role: "ADMIN",
    });
    expect(result).toEqual({ action: "redirect", url: "/admin/dashboard" });
  });
});
