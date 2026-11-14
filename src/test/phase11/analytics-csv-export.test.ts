import { describe, expect, it } from "vitest";

import { buildAnalyticsCsv, escapeCsvCell } from "@/modules/analytics/analytics-csv-export.service";
import type { AnalyticsSnapshot } from "@/types/admin";

describe("analytics CSV export", () => {
  it("neutralizes spreadsheet formula injection", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+cmd")).toBe("'+cmd");
  });

  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('Say "hi", team')).toBe('"Say ""hi"", team"');
  });

  it("includes refund rows when present", () => {
    const snapshot = {
      dataSource: "live",
      range: "30d",
      rangeLabel: "test",
      revenue: 100,
      orders: 2,
      aov: 50,
      customers: 10,
      newCustomers: 1,
      returningCustomers: 2,
      repeatPurchases: 1,
      leads: 3,
      qualifiedLeads: 1,
      conversionRate: 10,
      repeatCustomers: 2,
      leadSources: [],
      leadConversionFunnel: [],
      productPerformance: [],
      productEngagement: [],
      aiMetrics: {
        conversations: 0,
        recommendations: 0,
        recommendationClicks: 0,
        assistedConversions: 0,
      },
      aiAssistedConversions: 0,
      automationPerformance: [],
      refundMetrics: { refundCount: 1, refundTotalNgn: 20, netRevenueNgn: 80 },
    } satisfies AnalyticsSnapshot;

    const csv = buildAnalyticsCsv(snapshot);
    expect(csv).toContain("Net revenue (NGN),80");
  });
});
