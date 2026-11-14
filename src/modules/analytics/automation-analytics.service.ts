import { prisma } from "@/lib/db/prisma";
import type { ResolvedAnalyticsRange } from "@/modules/analytics/analytics-filters";
import { safeRate } from "@/modules/analytics/analytics-filters";

export type AutomationPerformanceRow = {
  automationId: string;
  name: string;
  runs: number;
  successes: number;
  failures: number;
  successRate: number;
};

export type AutomationAnalyticsMetrics = {
  activeAutomations: number;
  totalRuns: number;
  automationPerformance: AutomationPerformanceRow[];
};

export async function getAutomationAnalytics(
  tenantId: string,
  range: ResolvedAnalyticsRange,
): Promise<AutomationAnalyticsMetrics> {
  const runWhere = {
    tenantId,
    startedAt: { gte: range.start, lt: range.end },
  };

  const [activeAutomations, runs, automations] = await Promise.all([
    prisma.automation.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.automationRun.findMany({
      where: runWhere,
      select: {
        automationId: true,
        status: true,
      },
    }),
    prisma.automation.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
  ]);

  const nameById = new Map(automations.map((a) => [a.id, a.name]));
  const stats = new Map<string, { runs: number; successes: number; failures: number }>();

  for (const run of runs) {
    const bucket = stats.get(run.automationId) ?? { runs: 0, successes: 0, failures: 0 };
    bucket.runs += 1;
    if (run.status === "COMPLETED") bucket.successes += 1;
    if (run.status === "FAILED") bucket.failures += 1;
    stats.set(run.automationId, bucket);
  }

  const automationPerformance = [...stats.entries()]
    .map(([automationId, s]) => ({
      automationId,
      name: nameById.get(automationId) ?? automationId,
      runs: s.runs,
      successes: s.successes,
      failures: s.failures,
      successRate: safeRate(s.successes, s.runs),
    }))
    .sort((a, b) => b.runs - a.runs);

  return {
    activeAutomations,
    totalRuns: runs.length,
    automationPerformance,
  };
}
