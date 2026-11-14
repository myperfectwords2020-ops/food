import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LeadDetailActions } from "@/components/admin/lead-detail-actions";
import { LEAD_SOURCE_OPTIONS } from "@/lib/admin-constants";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await adminService.getLead(id);
  if (!lead) notFound();

  const nextStep = lead.followUpAt
    ? `Follow up ${new Date(lead.followUpAt).toLocaleString()}`
    : lead.status === "QUALIFIED"
      ? "Send routine proposal"
      : "Qualify interest and assign owner";

  return (
    <>
      <AdminBreadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Admin" },
          { href: "/admin/leads", label: "Leads" },
          { label: lead.name },
        ]}
      />
      <AdminPageHeader
        title={lead.name}
        description={`${lead.source} · ${lead.status.replaceAll("_", " ")} · score ${lead.score}`}
        actions={
          <LeadDetailActions
            leadId={lead.id}
            status={lead.status}
            convertedCustomerId={lead.convertedCustomerId}
          />
        }
      />
      <section className="panel mb-4 text-sm leading-7" aria-label="Lead summary">
        <h2 className="font-bold text-sm mb-2">Conversion snapshot</h2>
        <p>
          <strong>Who:</strong> {lead.name} ({lead.email})
        </p>
        <p>
          <strong>Source:</strong> {lead.source}
        </p>
        <p>
          <strong>Interest:</strong> {lead.interest} · {lead.concern}
        </p>
        <p>
          <strong>What happened:</strong> {lead.timeline[lead.timeline.length - 1]?.label ?? "—"}
        </p>
        <p>
          <strong>Next:</strong> {nextStep}
        </p>
        <p>
          <strong>Converted:</strong>{" "}
          {lead.convertedCustomerId ? `Yes · customer ${lead.convertedCustomerId}` : "Not yet"}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supported sources (configurable): {LEAD_SOURCE_OPTIONS.join(", ")}
        </p>
      </section>
      <div className="admin-grid">
        <section className="panel text-sm leading-7">
          <h2 className="font-bold text-sm mb-2">Qualification</h2>
          <p>Owner: {lead.owner}</p>
          <p>Concern: {lead.concern}</p>
          <p>Interest: {lead.interest}</p>
          <p>Qualification: {lead.qualification}</p>
          {lead.followUpAt ? <p>Follow-up: {new Date(lead.followUpAt).toLocaleString()}</p> : null}
        </section>
        <section className="panel">
          <h2 className="font-bold text-sm mb-2">Contact</h2>
          <p className="text-sm">{lead.email}</p>
          <p className="text-sm">{lead.phone}</p>
        </section>
      </div>
      <section className="panel mt-4">
        <h2 className="font-bold text-sm mb-2">Notes</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          {lead.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
      <section className="panel mt-4">
        <h2 className="font-bold text-sm mb-2">Timeline</h2>
        <ol className="text-sm space-y-2 list-decimal pl-5">
          {lead.timeline.map((t) => (
            <li key={t.id}>
              {t.label} · {new Date(t.at).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
      <section className="panel mt-4">
        <h2 className="font-bold text-sm mb-2">Interested products</h2>
        <p className="text-sm text-muted-foreground">IDs: {lead.interestedProductIds.join(", ")}</p>
        <h2 className="font-bold text-sm mb-2 mt-4">AI recommendations</h2>
        <ul className="text-sm space-y-1">
          {lead.aiRecommendationSlugs.map((slug) => (
            <li key={slug}>
              <Link href={`/products/${slug}`}>{slug}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
