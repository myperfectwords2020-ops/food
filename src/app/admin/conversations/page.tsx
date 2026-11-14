import Link from "next/link";
import { Suspense } from "react";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminListFilters } from "@/components/admin/admin-list-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { EmptyState, Status } from "@/components/page-ui";
import { parseAdminPage } from "@/lib/admin-list-utils";
import { adminService } from "@/services/index";
import type { ConversationChannel, ConversationStatus } from "@/types/admin";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminConversationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"] : undefined;
  const status =
    typeof sp["status"] === "string" ? (sp["status"] as ConversationStatus) : undefined;
  const channel =
    typeof sp["channel"] === "string" ? (sp["channel"] as ConversationChannel) : undefined;
  const page = parseAdminPage(typeof sp["page"] === "string" ? sp["page"] : undefined);

  const result = await adminService.listConversations({ q, status, channel }, page, 10);

  return (
    <>
      <AdminBreadcrumbs
        items={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Conversations" }]}
      />
      <AdminPageHeader
        title="Conversations"
        description="AI, email, and WhatsApp — real-time transport connects later via service layer."
      />
      <Suspense fallback={null}>
        <AdminListFilters
          fields={[
            { name: "q", label: "Search" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "active", label: "Active" },
                { value: "handoff_requested", label: "Handoff requested" },
                { value: "human_assigned", label: "Human assigned" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ],
            },
            {
              name: "channel",
              label: "Channel",
              type: "select",
              options: [
                { value: "ai_assistant", label: "AI assistant" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" },
              ],
            },
          ]}
        />
      </Suspense>
      {result.items.length === 0 ? (
        <EmptyState
          title="No conversations"
          copy="Messages will appear when channels are connected."
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Subject</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Unread</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/conversations/${c.id}`}>{c.customerName}</Link>
                    <div className="text-muted-foreground text-xs">{c.customerEmail}</div>
                  </td>
                  <td>{c.subject}</td>
                  <td>{c.channel.replaceAll("_", " ")}</td>
                  <td>
                    <Status
                      tone={
                        c.status === "handoff_requested" || c.status === "human_assigned"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {c.status.replaceAll("_", " ")}
                    </Status>
                  </td>
                  <td>{c.assignedToName ?? "—"}</td>
                  <td>{c.unreadStaffCount ?? 0}</td>
                  <td>{new Date(c.lastMessageAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPagination page={result.page} totalPages={result.totalPages} />
    </>
  );
}
