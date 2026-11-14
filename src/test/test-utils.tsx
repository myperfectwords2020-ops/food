import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";

import { makeQueryClient } from "@/lib/query/client";

export function createTestQueryClient() {
  return makeQueryClient();
}

export function TestQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createTestQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }) => <TestQueryProvider>{children}</TestQueryProvider>,
    ...options,
  });
}
