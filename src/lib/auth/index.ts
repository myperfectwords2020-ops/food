import { cache } from "react";
import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { AuthenticationError } from "@/lib/errors/app-error";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** Prefer JWT claims so authenticated storefront requests skip a User round-trip. */
export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  if (session.user.status && session.user.status !== "ACTIVE") return null;

  if (session.user.role) {
    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      tenantId: session.user.tenantId,
      status: session.user.status ?? "ACTIVE",
      customerId: session.user.customerId ?? null,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, tenantId: true, status: true },
  });

  if (!dbUser || dbUser.status !== "ACTIVE") return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    tenantId: dbUser.tenantId,
    status: dbUser.status,
    customerId: null,
  };
});

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthenticationError();
  return user;
}
