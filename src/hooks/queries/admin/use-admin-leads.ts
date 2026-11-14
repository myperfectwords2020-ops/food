"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { fetchAdminLeadsAction } from "@/app/actions/admin-queries";
import { parseAdminPage } from "@/lib/admin-list-utils";
import { adminKeys } from "@/lib/query/query-keys";
import { staleTimes } from "@/lib/query/stale-times";
import type { LeadStatus } from "@/types/admin";

export function useAdminLeadsQuery() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const status = (params.get("status") as LeadStatus | null) ?? undefined;
  const source = params.get("source") ?? undefined;
  const page = parseAdminPage(params.get("page") ?? undefined);
  const filters = { q, status, source, page, pageSize: 20 };

  return useQuery({
    queryKey: adminKeys.leads(filters),
    queryFn: () => fetchAdminLeadsAction(filters),
    staleTime: staleTimes.adminList,
  });
}
