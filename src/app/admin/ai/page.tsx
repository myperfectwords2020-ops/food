import Link from "next/link";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminMockBanner } from "@/components/admin/admin-mock-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminService } from "@/services/index";

export default async function AdminAiPage() {
  const ai = await adminService.getAiOverview();

  return (
    <>
      <AdminBreadcrumbs items={[{ href: "/admin/dashboard", label: "Admin" }, { label: "AI" }]} />
      <AdminPageHeader
        title="AI management"
        description="Monitor assistant activity — tools run server-side only."
      />
      <AdminMockBanner label="Some AI analytics panels still use mock data; conversation counts are live." />
      <div className="metric-grid">
        {(
          [
            ["Conversations", ai.conversationCount],
            ["Recommendations", ai.recommendationCount],
            ["Handoffs", ai.handoffCount],
            ["Failed", ai.failedCount],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="metric-card">
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-grid mt-4">
        <section className="panel">
          <div className="panel-head">
            <h2>Configuration</h2>
          </div>
          <ul className="text-sm space-y-2">
            <li>Model: {ai.config.modelLabel}</li>
            <li>Handoff: {ai.config.handoffEnabled ? "Enabled" : "Disabled"}</li>
            <li>Catalog search tool: {ai.config.catalogSearchEnabled ? "On" : "Off"}</li>
            <li>Order lookup tool: {ai.config.orderLookupEnabled ? "On" : "Off"}</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4 leading-6">
            API keys and prompts are never stored in the browser. The assistant cannot run SQL,
            shell commands, or change payments from the UI.
          </p>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Tool activity</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Calls</th>
                <th>Last used</th>
              </tr>
            </thead>
            <tbody>
              {ai.toolActivity.map((t) => (
                <tr key={t.tool}>
                  <td>{t.tool}</td>
                  <td>{t.calls}</td>
                  <td>{new Date(t.lastUsed).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <section className="panel mt-4 overflow-x-auto">
        <div className="panel-head">
          <h2>Recommendation performance</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Recommendations</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {ai.recommendationPerformance.map((r) => (
              <tr key={r.productName}>
                <td>{r.productName}</td>
                <td>{r.recommendations}</td>
                <td>{r.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel mt-4 overflow-x-auto">
        <div className="panel-head">
          <h2>Recent conversations</h2>
          <Link href="/admin/conversations">Open inbox</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Preview</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {ai.recentConversations.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/conversations/${c.id}`}>{c.customer}</Link>
                </td>
                <td>{c.preview}</td>
                <td>{new Date(c.at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel mt-4">
        <div className="panel-head">
          <h2>Failed interactions</h2>
        </div>
        <ul className="text-sm space-y-2">
          {ai.failedInteractions.map((f) => (
            <li key={f.id}>
              {f.reason} · {new Date(f.at).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
