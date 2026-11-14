"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { fetchAdminProductsAction } from "@/app/actions/admin-queries";
import { queryKeys } from "@/lib/query/keys";
import type { AdminProductStatus } from "@/types/admin";

export function useAdminProductsQuery() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const status = (params.get("status") as AdminProductStatus | null) ?? undefined;
  const filters = { q, status };

  return useQuery({
    queryKey: queryKeys.admin.products(filters),
    queryFn: () => fetchAdminProductsAction(filters),
  });
}
