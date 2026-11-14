import type { Lead, LeadActivity, LeadSource, LeadStatus, User } from "@prisma/client";

export type LeadListItemDTO = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  qualification: "unqualified" | "marketing_qualified" | "sales_qualified";
  owner: string;
  ownerId: string | null;
  concern: string;
  interest: string;
  followUpAt: string | null;
  convertedCustomerId: string | null;
  lastActivity: string;
};

export type LeadActivityDTO = {
  id: string;
  type: string;
  description: string;
  at: string;
  actorName: string | null;
};

export type LeadDetailDTO = LeadListItemDTO & {
  notes: string[];
  timeline: LeadActivityDTO[];
  scoreReasons: string[];
  sourceDetail: string | null;
  interestedProductIds: string[];
  aiRecommendationSlugs: string[];
};

type LeadWithOwner = Lead & { owner: Pick<User, "firstName" | "lastName" | "email"> | null };

function mapQualification(status: LeadStatus, score: number): LeadListItemDTO["qualification"] {
  if (status === "QUALIFIED" || status === "CONVERTED") return "sales_qualified";
  if (score >= 40) return "marketing_qualified";
  return "unqualified";
}

function ownerLabel(owner: LeadWithOwner["owner"]): string {
  if (!owner) return "Unassigned";
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  return name || owner.email;
}

export function toLeadListItemDTO(lead: LeadWithOwner, lastActivityAt: Date): LeadListItemDTO {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    source: lead.source,
    status: lead.status,
    score: lead.score,
    qualification: mapQualification(lead.status, lead.score),
    owner: ownerLabel(lead.owner),
    ownerId: lead.ownerId,
    concern: lead.concern ?? "",
    interest: lead.interest ?? "",
    followUpAt: lead.followUpAt?.toISOString() ?? null,
    convertedCustomerId: lead.customerId,
    lastActivity: lastActivityAt.toISOString(),
  };
}

export function toLeadActivityDTO(
  activity: LeadActivity & { actor: Pick<User, "firstName" | "lastName" | "email"> | null },
): LeadActivityDTO {
  const actorName = activity.actor
    ? [activity.actor.firstName, activity.actor.lastName].filter(Boolean).join(" ").trim() ||
      activity.actor.email
    : null;
  return {
    id: activity.id,
    type: activity.type,
    description: activity.description,
    at: activity.createdAt.toISOString(),
    actorName,
  };
}

export function toLeadDetailDTO(
  lead: LeadWithOwner,
  activities: (LeadActivity & { actor: Pick<User, "firstName" | "lastName" | "email"> | null })[],
): LeadDetailDTO {
  const notesRaw = lead.notes;
  const notes =
    Array.isArray(notesRaw) && notesRaw.every((n) => typeof n === "string")
      ? (notesRaw as string[])
      : [];
  const scoreReasons = Array.isArray(lead.scoreReasons)
    ? (lead.scoreReasons as string[]).filter((r) => typeof r === "string")
    : [];

  const lastActivity = activities[activities.length - 1]?.createdAt ?? lead.updatedAt;

  return {
    ...toLeadListItemDTO(lead, lastActivity),
    notes,
    timeline: activities.map(toLeadActivityDTO),
    scoreReasons,
    sourceDetail: lead.sourceDetail,
    interestedProductIds: [],
    aiRecommendationSlugs: [],
  };
}

/** Maps detail DTO to legacy AdminLead shape for existing admin pages. */
export function toAdminLead(detail: LeadDetailDTO) {
  const legacyStage =
    detail.status === "CONVERTED"
      ? ("CUSTOMER" as const)
      : detail.status === "QUALIFIED"
        ? ("QUALIFIED" as const)
        : ("LEAD" as const);

  return {
    id: detail.id,
    name: detail.name,
    email: detail.email,
    phone: detail.phone,
    source: detail.source.replaceAll("_", " ").toLowerCase(),
    stage: legacyStage,
    status: detail.status,
    score: detail.score,
    qualification: detail.qualification,
    owner: detail.owner,
    concern: detail.concern,
    interest: detail.interest,
    notes: detail.notes,
    timeline: detail.timeline.map((t) => ({
      id: t.id,
      label: t.description,
      at: t.at,
    })),
    interestedProductIds: detail.interestedProductIds,
    aiRecommendationSlugs: detail.aiRecommendationSlugs,
    followUpAt: detail.followUpAt ?? undefined,
    convertedCustomerId: detail.convertedCustomerId ?? undefined,
    lastActivity: detail.lastActivity,
  };
}
