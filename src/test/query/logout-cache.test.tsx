import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

function seedClient(client: QueryClient) {
  client.setQueryData(["admin", "orders"], { items: [] });
  client.setQueryData(["cart", "server"], { lines: [] });
}

describe("logout cache clearing pattern", () => {
  it("queryClient.clear removes seeded private queries", () => {
    const client = new QueryClient();
    seedClient(client);

    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useQueryClient(), { wrapper });

    act(() => {
      result.current.clear();
    });

    expect(result.current.getQueryData(["admin", "orders"])).toBeUndefined();
    expect(result.current.getQueryData(["cart", "server"])).toBeUndefined();
  });
});
