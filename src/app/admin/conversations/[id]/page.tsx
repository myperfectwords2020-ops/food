import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminConversationWorkspace } from "@/components/admin/admin-conversation-workspace";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Status } from "@/components/page-ui";
import { adminService } from "@/services/index";

type Props = { params: Promise<{ id: string }> };

export default async function AdminConversationDetailPage({ params }: Props) {
  const { id } = await params;
  const conversation = await adminService.getConversation(id);
  if (!conversation) notFound();

  return (
    <>
      <AdminBreadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Admin" },
          { href: "/admin/conversations", label: "Conversations" },
          { label: conversation.subject },
        ]}
      />
      <AdminPageHeader
        title={conversation.subject}
        description={`${conversation.customerName} · ${conversation.channel.replaceAll("_", " ")}`}
      />
      {conversation.leadId ? (
        <p className="text-sm mb-4">
          Lead: <Link href={`/admin/leads/${conversation.leadId}`}>{conversation.leadId}</Link>
        </p>
      ) : null}
      <section className="panel mb-4 text-sm">
        <p>
          Status: <Status tone="neutral">{conversation.status.replaceAll("_", " ")}</Status>
        </p>
        {conversation.handoffRequested ? (
          <p className="mt-2 text-amber-800 dark:text-amber-200">Human handoff requested</p>
        ) : null}
        {conversation.assignedToName ? (
          <p className="mt-2">Assigned to: {conversation.assignedToName}</p>
        ) : null}
        <p className="text-muted-foreground mt-2">{conversation.contextSummary}</p>
      </section>
      <AdminConversationWorkspace conversation={conversation} />
    </>
  );
}
