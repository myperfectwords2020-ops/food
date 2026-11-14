import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

import { shouldRetryQueryFailure } from "@/lib/query/query-utils";

const queryDefaults: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => failureCount < 1 && shouldRetryQueryFailure(error),
  },
  mutations: {
    retry: false,
  },
};

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: queryDefaults });
}
