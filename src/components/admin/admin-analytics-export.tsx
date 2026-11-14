"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { exportAdminAnalyticsCsvAction } from "@/app/actions/admin-queries";
import { parseAdminDateRange } from "@/lib/admin-constants";
import { Button } from "@/components/ui/button";
import type { AdminDateRange } from "@/types/admin";

export function AdminAnalyticsExport() {
  const params = useSearchParams();
  const range = parseAdminDateRange(params.get("range") ?? undefined) as AdminDateRange;
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    try {
      const result = await exportAdminAnalyticsCsvAction(range);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Analytics export downloaded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void onExport()}
    >
      {loading ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
