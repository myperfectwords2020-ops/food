import { LeadSource, type Prisma } from "@prisma/client";

import { authorize } from "@/lib/auth/authorize-context";
import type { RequestContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { tenantScopeWhere } from "@/lib/db/tenant-query";
import { ValidationError } from "@/lib/errors/app-error";
import { toAdminLead, toLeadDetailDTO, toLeadListItemDTO } from "@/modules/leads/lead.dto";
import { adminLeadListFiltersSchema } from "@/modules/leads/lead.validation";
import type { AdminLead, AdminLeadFilters, AdminPaginated } from "@/types/admin";

export async function listAdminLeads(
  context: RequestContext,
  rawFilters?: AdminLeadFilters,
): Promise<AdminPaginated<AdminLead>> {
  authorize(context, "crm.leads.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const sourceRaw = rawFilters?.source;
  const sourceEnum =
    sourceRaw && (Object.values(LeadSource) as string[]).includes(sourceRaw)
      ? (sourceRaw as LeadSource)
      : undefined;

  const filters = adminLeadListFiltersSchema.parse({
    q: rawFilters?.q,
    status: rawFilters?.status,
    source: sourceEnum,
    ownerId: rawFilters?.ownerId,
    page: rawFilters?.page ?? 1,
    pageSize: rawFilters?.pageSize ?? 20,
  });

  const where: Prisma.LeadWhereInput = {
    ...tenantScopeWhere(tenantId, context.role),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { phone: { contains: filters.q, mode: "insensitive" } },
            { normalizedEmail: { contains: filters.q.toLowerCase(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  const items = rows.map((row) => {
    const last = row.activities[0]?.createdAt ?? row.updatedAt;
    const dto = toLeadListItemDTO(row, last);
    return toAdminLead({
      ...dto,
      notes: [],
      timeline: [],
      scoreReasons: [],
      sourceDetail: null,
      interestedProductIds: [],
      aiRecommendationSlugs: [],
    });
  });

  return {
    items,
    page: filters.page,
    pageSize: filters.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getAdminLead(context: RequestContext, id: string): Promise<AdminLead | null> {
  authorize(context, "crm.leads.read");
  const tenantId = context.tenantId;
  if (!tenantId) throw new ValidationError("Tenant required.");

  const lead = await prisma.lead.findFirst({
    where: { id, ...tenantScopeWhere(tenantId, context.role) },
    include: {
      owner: { select: { firstName: true, lastName: true, email: true } },
      activities: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!lead) return null;

  const detail = toLeadDetailDTO(lead, lead.activities);
  return toAdminLead(detail);
}
