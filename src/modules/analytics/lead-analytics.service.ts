import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";
import { safeRate } from "@/modules/analytics/analytics-filters";
import type { LeadLifecycleStage } from "@/types/admin";

export type LeadAnalyticsMetrics = {
  leadsCreated: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadSources: { source: string; count: number }[];
  leadConversionFunnel: { stage: LeadLifecycleStage; count: number }[];
};

const FUNNEL_STAGES: LeadLifecycleStage[] = [
  "VISITOR",
  "LEAD",
  "QUALIFIED",
  "CUSTOMER",
  "REPEAT_CUSTOMER",
];

function formatLeadSource(source: string): string {
  return source
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getLeadAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<LeadAnalyticsMetrics> {
  const createdWhere = {
    tenantId,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [leadsCreated, qualifiedLeads, convertedLeads, sourceGroups, lifecycleGroups] =
    await Promise.all([
      prisma.lead.count({ where: createdWhere }),
      prisma.lead.count({
        where: {
          ...createdWhere,
          OR: [{ status: "QUALIFIED" }, { qualifiedAt: { not: null } }],
        },
      }),
      prisma.lead.count({
        where: {
          ...createdWhere,
          OR: [{ status: "CONVERTED" }, { convertedAt: { not: null } }],
        },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: createdWhere,
        _count: { _all: true },
      }),
      prisma.customer.groupBy({
        by: ["lifecycle"],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

  const lifecycleMap = new Map(lifecycleGroups.map((g) => [g.lifecycle, g._count._all]));
  const leadConversionFunnel = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: lifecycleMap.get(stage) ?? 0,
  }));

  return {
    leadsCreated,
    qualifiedLeads,
    convertedLeads,
    conversionRate: safeRate(convertedLeads, leadsCreated),
    leadSources: sourceGroups
      .map((g) => ({ source: formatLeadSource(g.source), count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    leadConversionFunnel,
  };
}
