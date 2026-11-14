"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AssistantProvider } from "@/components/assistant/assistant-context";

export function AssistantShell({
  children,
  customerName,
  dietaryHint,
  recentFocus,
}: {
  children: ReactNode;
  customerName?: string | undefined;
  dietaryHint?: string | undefined;
  recentFocus?: string | undefined;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = pathname.startsWith("/admin");
  const resolvedName = customerName ?? session?.user?.name ?? session?.user?.email ?? undefined;

  return (
    <AssistantProvider>
      {children}
      {!isAdmin ? (
        <AssistantPanel
          customerName={resolvedName}
          dietaryHint={dietaryHint}
          recentFocus={recentFocus}
        />
      ) : null}
    </AssistantProvider>
  );
}
