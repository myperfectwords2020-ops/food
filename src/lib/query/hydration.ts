import {
  dehydrate,
  HydrationBoundary,
  type DehydratedState,
  QueryClient,
} from "@tanstack/react-query";

export { dehydrate, HydrationBoundary };
export type { DehydratedState };

/** Prefetch on the server, pass `state` into HydrationBoundary on the client. */
export async function prefetchIntoState(
  queryClient: QueryClient,
  prefetchers: Array<() => Promise<void>>,
): Promise<DehydratedState> {
  await Promise.all(prefetchers.map((fn) => fn()));
  return dehydrate(queryClient);
}
