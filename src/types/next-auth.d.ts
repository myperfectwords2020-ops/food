import type { Role, UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      tenantId: string | null;
      status?: UserStatus;
      customerId?: string | null;
    };
  }

  interface User {
    role?: Role;
    tenantId?: string | null;
    status?: UserStatus;
    customerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    tenantId?: string | null;
    status?: UserStatus;
    customerId?: string | null;
  }
}
