"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { fetchAdminCustomersAction } from "@/app/actions/admin-queries";
import { queryKeys } from "@/lib/query/keys";
import type { LeadLifecycleStage } from "@/types/admin";

export function useAdminCustomersQuery() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const lifecycle = (params.get("lifecycle") as LeadLifecycleStage | null) ?? undefined;
  const filters = { q, lifecycle };

  return useQuery({
    queryKey: queryKeys.admin.customers(filters),
    queryFn: () => fetchAdminCustomersAction(filters),
  });
}
