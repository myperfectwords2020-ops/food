"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AppQueryProvider } from "@/lib/query/query-provider";

type Props = {
  children: ReactNode;
  /** From `auth()` in the root layout. Omit in tests so the client can fetch session. */
  session?: Session | null;
};

export function Providers({ children, session }: Props) {
  const sessionProps = session !== undefined ? { session } : {};
  return (
    <SessionProvider refetchOnWindowFocus={false} {...sessionProps}>
      <AppQueryProvider>
        {children}
        <Toaster richColors closeButton />
      </AppQueryProvider>
    </SessionProvider>
  );
}
