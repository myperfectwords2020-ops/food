import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { authSessionCookieName } from "@/lib/auth/session-cookie";
import { evaluateRouteAccess } from "@/lib/auth/route-guards";
import type { Role } from "@prisma/client";

export async function middleware(req: NextRequest) {
  const secret = process.env["AUTH_SECRET"];
  const token = secret
    ? await getToken({
        req,
        secret,
        secureCookie: process.env.NODE_ENV === "production",
        cookieName: authSessionCookieName(),
      })
    : null;

  const role = token?.["role"] as Role | undefined;
  const decision = evaluateRouteAccess({
    pathname: req.nextUrl.pathname,
    isAuthenticated: Boolean(token?.sub),
    role,
  });

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.url, req.nextUrl.origin));
  }

  if (decision.action === "rewrite") {
    return NextResponse.rewrite(new URL(decision.url, req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
