import type { Role } from "@prisma/client";

import { homePathForRole } from "@/lib/auth/post-auth-redirect";
import { canAccessAdminArea, isCustomerRole } from "@/lib/auth/permissions";

export type RouteGuardInput = {
  pathname: string;
  isAuthenticated: boolean;
  role?: Role | undefined;
};

export type RouteGuardResult =
  { action: "allow" } | { action: "redirect"; url: string } | { action: "rewrite"; url: string };

export function evaluateRouteAccess(input: RouteGuardInput): RouteGuardResult {
  const { pathname, isAuthenticated, role } = input;

  const isLoginOrRegister =
    pathname.startsWith("/account/login") || pathname.startsWith("/account/register");

  const isAccountRoute = pathname.startsWith("/account") && !isLoginOrRegister;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isLoginOrRegister && isAuthenticated && role) {
    return { action: "redirect", url: homePathForRole(role) };
  }

  if (isAccountRoute && !isAuthenticated) {
    const login = new URL("/account/login", "http://local");
    login.searchParams.set("callbackUrl", pathname);
    return { action: "redirect", url: `${login.pathname}${login.search}` };
  }

  if (isAccountRoute && role && !isCustomerRole(role)) {
    return { action: "redirect", url: "/admin/dashboard" };
  }

  if (isAdminRoute && !isAuthenticated) {
    const login = new URL("/account/login", "http://local");
    login.searchParams.set("callbackUrl", pathname);
    return { action: "redirect", url: `${login.pathname}${login.search}` };
  }

  if (isAdminRoute && role && !canAccessAdminArea(role)) {
    return { action: "rewrite", url: "/access-denied" };
  }

  return { action: "allow" };
}
