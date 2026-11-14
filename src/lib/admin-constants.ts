import type { LeadLifecycleStage } from "@/types/admin";

export const ADMIN_DATE_RANGES = ["7d", "30d", "90d"] as const;

export const LEAD_SOURCE_OPTIONS = [
  "website",
  "routine quiz",
  "AI assistant",
  "social media",
  "referral",
  "campaign",
  "manual",
] as const;

export const LIFECYCLE_STAGES: LeadLifecycleStage[] = [
  "VISITOR",
  "LEAD",
  "QUALIFIED",
  "CUSTOMER",
  "REPEAT_CUSTOMER",
];

export function parseAdminDateRange(value?: string | undefined) {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d" as const;
}

export function adminRangeLabel(range: (typeof ADMIN_DATE_RANGES)[number]) {
  if (range === "7d") return "Last 7 days";
  if (range === "90d") return "Last 90 days";
  return "Last 30 days";
}
