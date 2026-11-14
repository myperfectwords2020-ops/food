import type { AnalyticsSnapshot } from "@/types/admin";

export const ANALYTICS_CSV_MAX_ROWS = 500;

/** Escape CSV and neutralize spreadsheet formula injection. */
export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  let v = raw;
  if (/^[=+\-@\t\r]/.test(v)) {
    v = `'${v}`;
  }
  if (v.includes('"') || v.includes(",") || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function row(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function buildAnalyticsCsv(snapshot: AnalyticsSnapshot): string {
  const lines: string[] = [];
  lines.push(row(["Report", "Analytics export"]));
  lines.push(row(["Range", snapshot.range]));
  lines.push(row(["Generated", new Date().toISOString()]));
  lines.push("");

  lines.push(row(["Revenue (NGN verified paid)", snapshot.revenue]));
  lines.push(row(["Paid orders", snapshot.orders]));
  lines.push(row(["AOV", snapshot.aov]));
  if (snapshot.refundMetrics) {
    lines.push(row(["Refunds (NGN)", snapshot.refundMetrics.refundTotalNgn]));
    lines.push(row(["Net revenue (NGN)", snapshot.refundMetrics.netRevenueNgn]));
    lines.push(row(["Refund count", snapshot.refundMetrics.refundCount]));
  }
  lines.push("");

  lines.push(row(["Product", "Views", "Add to cart", "Purchases", "Conv %"]));
  const engagement = snapshot.productEngagement.slice(0, ANALYTICS_CSV_MAX_ROWS);
  for (const p of engagement) {
    lines.push(row([p.name, p.views, p.addToCart, p.purchases, p.conversionRate]));
  }
  lines.push("");

  lines.push(row(["Lead source", "Count"]));
  for (const s of snapshot.leadSources.slice(0, ANALYTICS_CSV_MAX_ROWS)) {
    lines.push(row([s.source, s.count]));
  }

  return lines.join("\n");
}
