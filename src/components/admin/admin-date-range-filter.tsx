"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ADMIN_DATE_RANGES } from "@/lib/admin-constants";

export function AdminDateRangeFilter({ paramName = "range" }: { paramName?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get(paramName) ?? "30d";

  return (
    <fieldset className="flex flex-wrap gap-2 items-center border-0 m-0 p-0">
      <legend className="sr-only">Date range</legend>
      {ADMIN_DATE_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={current === range ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
          aria-pressed={current === range}
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.set(paramName, range);
            router.push(`?${next.toString()}`);
          }}
        >
          {range}
        </button>
      ))}
    </fieldset>
  );
}
