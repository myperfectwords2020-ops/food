import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminDashboardPanel } from "@/components/admin/lists/admin-dashboard-panel";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminBreadcrumbs
        items={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Dashboard" }]}
      />
      <AdminPageHeader title="Dashboard" description="Operational overview for your store." />
      <AdminDashboardPanel />
    </>
  );
}
