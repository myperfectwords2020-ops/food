import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import type { Role, UserStatus } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log.service";
import { authSessionCookieName } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";
import { authenticateCredentials } from "@/modules/auth/auth.service";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().min(1),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  cookies: {
    sessionToken: {
      name: authSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/account/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Store", type: "text" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers?.get("x-real-ip") ??
          undefined;

        const result = await authenticateCredentials({
          tenantSlug: parsed.data.tenantSlug,
          email: parsed.data.email,
          password: parsed.data.password,
          ipAddress: ip,
        });

        if (!result.ok) return null;
        return result.user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role?: Role;
          tenantId?: string | null;
          status?: UserStatus;
          customerId?: string | null;
        };
        token.role = u.role ?? "CUSTOMER";
        token.tenantId = u.tenantId ?? null;
        token.status = u.status ?? "ACTIVE";
        token.customerId = u.customerId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "CUSTOMER";
        session.user.tenantId = token.tenantId ?? null;
        session.user.status = token.status ?? "ACTIVE";
        session.user.customerId = token.customerId ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      await writeAuditLog({
        actorId: message.user.id ?? undefined,
        action: "auth.login",
        entityType: "User",
        entityId: message.user.id ?? undefined,
      });
      logger.info("auth_sign_in", { userId: message.user.id ?? undefined, operation: "auth" });
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
