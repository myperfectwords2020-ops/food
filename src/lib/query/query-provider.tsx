"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { seedGuestCartFromStorage } from "@/lib/query/cart-cache";
import { makeQueryClient } from "@/lib/query/query-client";

type Props = {
  children: ReactNode;
};

/** Single browser QueryClient per session (see makeQueryClient). */
export function AppQueryProvider({ children }: Props) {
  const [queryClient] = useState(() => makeQueryClient());

  useEffect(() => {
    seedGuestCartFromStorage(queryClient);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
