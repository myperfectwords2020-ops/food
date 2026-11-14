import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AutomationEditor } from "@/components/admin/automation-editor";
import { EmptyState } from "@/components/page-ui";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminAutomationDetailPage({ params }: Props) {
  const { id } = await params;
  const automation = await adminService.getAutomation(id);
  if (!automation) notFound();

  return (
    <>
      <AdminPageHeader title={automation.name} description={automation.actionsSummary} />
      <AutomationEditor mode="edit" automation={automation} />
      <section className="panel mt-8 overflow-x-auto">
        <div className="panel-head">
          <h2>Execution history</h2>
        </div>
        {automation.runs.length === 0 ? (
          <EmptyState
            title="No runs yet"
            copy="Executions will log here when workers are connected."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {automation.runs.map((r) => (
                <tr key={r.id}>
                  <td>{r.status}</td>
                  <td>{new Date(r.startedAt).toLocaleString()}</td>
                  <td>{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : "—"}</td>
                  <td>{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
