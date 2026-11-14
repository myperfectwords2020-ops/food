"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { fetchAdminDashboardAction } from "@/app/actions/admin-queries";
import { parseAdminDateRange } from "@/lib/admin-constants";
import { queryKeys } from "@/lib/query/keys";
import type { AdminDateRange } from "@/types/admin";

export function useAdminDashboardQuery() {
  const params = useSearchParams();
  const range = parseAdminDateRange(params.get("range") ?? undefined) as AdminDateRange;

  return useQuery({
    queryKey: queryKeys.admin.dashboard(range),
    queryFn: () => fetchAdminDashboardAction(range),
  });
}
