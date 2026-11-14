"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { fetchAdminOrdersAction } from "@/app/actions/admin-queries";
import { parseAdminPage } from "@/lib/admin-list-utils";
import { adminKeys } from "@/lib/query/query-keys";
import { staleTimes } from "@/lib/query/stale-times";
import type { OrderStatus } from "@/types/commerce";

export function useAdminOrdersQuery() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const status = (params.get("status") as OrderStatus | null) ?? undefined;
  const paymentStatus =
    (params.get("payment") as "pending" | "paid" | "failed" | null) ?? undefined;
  const page = parseAdminPage(params.get("page") ?? undefined);

  const filters = { q, status, paymentStatus, page, pageSize: 10 };

  return useQuery({
    queryKey: adminKeys.orders(filters),
    queryFn: () => fetchAdminOrdersAction(filters),
    staleTime: staleTimes.adminList,
  });
}
