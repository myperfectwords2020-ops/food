import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState, Status } from "@/components/page-ui";
import { adminService } from "@/services/index";

export default async function AdminAutomationsPage() {
  const automations = await adminService.listAutomations();

  return (
    <>
      <AdminPageHeader
        title="Automations"
        description="Workflows run on the server via BullMQ when connected."
        actions={
          <Link href="/admin/automations/new" className="btn btn-primary btn-md">
            New automation
          </Link>
        }
      />
      {automations.length === 0 ? (
        <EmptyState
          title="No automations"
          copy="Create a workflow to recover carts or follow up post-purchase."
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Runs</th>
                <th>Success</th>
                <th>Failed</th>
                <th>Last run</th>
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/automations/${a.id}`}>{a.name}</Link>
                  </td>
                  <td>{a.trigger}</td>
                  <td>
                    <Status tone={a.status === "enabled" ? "success" : "neutral"}>
                      {a.status}
                    </Status>
                  </td>
                  <td>{a.executionCount}</td>
                  <td>{a.successCount}</td>
                  <td>{a.failureCount}</td>
                  <td>{a.lastExecutedAt ? new Date(a.lastExecutedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
