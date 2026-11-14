import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminAnalyticsPanel } from "@/components/admin/lists/admin-analytics-panel";

export default function AdminAnalyticsPage() {
  return (
    <>
      <AdminBreadcrumbs
        items={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Analytics" }]}
      />
      <AdminPageHeader
        title="Analytics"
        description="Revenue, customers, leads, and product engagement."
      />
      <AdminAnalyticsPanel />
    </>
  );
}
