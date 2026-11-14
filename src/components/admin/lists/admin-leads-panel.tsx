"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AdminListFilters } from "@/components/admin/admin-list-filters";
import { AdminQueryState } from "@/components/admin/lists/admin-query-state";
import { EmptyState } from "@/components/page-ui";
import { useAdminLeadsQuery } from "@/hooks/queries/admin/use-admin-leads";
import { AdminPagination } from "@/components/admin/admin-pagination";
import type { LeadStatus } from "@/types/admin";

const statuses: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
  "LOST",
];

function AdminLeadsContent() {
  const { data, isLoading, isError, error } = useAdminLeadsQuery();
  const rows = data?.items ?? [];

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
    >
      <>
        <div className="kanban mb-6">
          {statuses.map((statusKey) => {
            const col = rows.filter((l) => l.status === statusKey);
            return (
              <div key={statusKey} className="kanban-col">
                <h3>
                  {statusKey.replaceAll("_", " ")} ({col.length})
                </h3>
                {col.map((l) => (
                  <Link key={l.id} href={`/admin/leads/${l.id}`} className="lead-card block">
                    <strong>{l.name}</strong>
                    <p>{l.interest}</p>
                    <p>
                      {l.source} · {l.owner}
                    </p>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No leads"
            copy="Lead capture will populate this view when connected."
          />
        ) : (
          <div className="panel overflow-x-auto">
            <div className="panel-head">
              <h2>All leads</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Qualification</th>
                  <th>Owner</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`}>{l.name}</Link>
                    </td>
                    <td>{l.source}</td>
                    <td>{l.status.replaceAll("_", " ")}</td>
                    <td>{l.score}</td>
                    <td>{l.qualification}</td>
                    <td>{l.owner}</td>
                    <td>{l.followUpAt ? new Date(l.followUpAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 1 ? (
          <AdminPagination page={data.page} totalPages={data.totalPages} />
        ) : null}
      </>
    </AdminQueryState>
  );
}

export function AdminLeadsPanel() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminListFilters
          fields={[
            { name: "q", label: "Search" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: statuses.map((s) => ({ value: s, label: s.replaceAll("_", " ") })),
            },
          ]}
        />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AdminLeadsContent />
      </Suspense>
    </>
  );
}
