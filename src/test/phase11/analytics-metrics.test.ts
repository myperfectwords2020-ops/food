import { describe, expect, it } from "vitest";

import {
  formatComparisonLabel,
  resolveAnalyticsRange,
  safeRate,
} from "@/modules/analytics/analytics-filters";
import {
  dedupeSucceededPayments,
  sumPaidRevenueByCurrency,
} from "@/modules/analytics/revenue-analytics.service";

describe("analytics filters", () => {
  it("uses half-open UTC day ranges", () => {
    const now = new Date("2026-03-15T14:30:00.000Z");
    const range = resolveAnalyticsRange("7d", now);
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    expect(range.priorEnd.getTime()).toBe(range.start.getTime());
  });

  it("returns zero rate when denominator is zero", () => {
    expect(safeRate(5, 0)).toBe(0);
  });

  it("labels comparison when prior baseline missing", () => {
    expect(formatComparisonLabel(100, 0)).toContain("No prior period baseline");
  });
});

describe("revenue deduplication", () => {
  it("counts one succeeded payment per order", () => {
    const rows = [
      {
        orderId: "o1",
        amountMinor: 100_00,
        currency: "NGN",
        paidAt: new Date("2026-01-02T10:00:00Z"),
      },
      {
        orderId: "o1",
        amountMinor: 100_00,
        currency: "NGN",
        paidAt: new Date("2026-01-02T11:00:00Z"),
      },
      {
        orderId: "o2",
        amountMinor: 50_00,
        currency: "NGN",
        paidAt: new Date("2026-01-03T10:00:00Z"),
      },
    ];
    const deduped = dedupeSucceededPayments(rows);
    expect(deduped).toHaveLength(2);
    const totals = sumPaidRevenueByCurrency(deduped);
    expect(totals["NGN"]).toBe(150);
  });

  it("does not combine different currencies into one bucket total", () => {
    const totals = sumPaidRevenueByCurrency([
      {
        orderId: "o1",
        amountMinor: 100_00,
        currency: "NGN",
        paidAt: new Date(),
      },
      {
        orderId: "o2",
        amountMinor: 10_00,
        currency: "USD",
        paidAt: new Date(),
      },
    ]);
    expect(totals["NGN"]).toBe(100);
    expect(totals["USD"]).toBe(10);
  });
});
