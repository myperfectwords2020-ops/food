import type { AdminDateRange } from "@/types/admin";

/** Application default when tenant timezone is not configured. */
export const ANALYTICS_DEFAULT_TIMEZONE = "Africa/Lagos";

/** Maximum inclusive calendar span for expensive reports. */
export const ANALYTICS_MAX_RANGE_DAYS = 366;

export type ResolvedAnalyticsRange = {
  preset: AdminDateRange;
  /** UTC instant — start inclusive */
  start: Date;
  /** UTC instant — end exclusive */
  end: Date;
  /** Prior period of equal length for comparisons */
  priorStart: Date;
  priorEnd: Date;
  label: string;
};

const PRESET_DAYS: Record<AdminDateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function parseAnalyticsPreset(value?: string | null): AdminDateRange {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d";
}

export function resolveAnalyticsRange(
  preset: AdminDateRange,
  now: Date = new Date(),
): ResolvedAnalyticsRange {
  const days = PRESET_DAYS[preset];
  if (days > ANALYTICS_MAX_RANGE_DAYS) {
    throw new Error("Date range exceeds maximum allowed window.");
  }

  const end = startOfUtcDay(addUtcDays(now, 1));
  const start = addUtcDays(end, -days);
  const priorEnd = start;
  const priorStart = addUtcDays(priorEnd, -days);

  const label =
    preset === "7d"
      ? "Last 7 days"
      : preset === "90d"
        ? "Last 90 days"
        : "Last 30 days";

  return { preset, start, end, priorStart, priorEnd, label };
}

export function formatComparisonLabel(current: number, previous: number): string {
  if (previous <= 0) {
    return current <= 0 ? "No change vs prior period" : "No prior period baseline";
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "Flat vs prior period";
  return pct > 0 ? `+${pct}% vs prior period` : `${pct}% vs prior period`;
}

export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
