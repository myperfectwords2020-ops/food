import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminOrdersPanel } from "@/components/admin/lists/admin-orders-panel";

export default function AdminOrdersPage() {
  return (
    <>
      <AdminBreadcrumbs
        items={[{ href: "/admin/dashboard", label: "Admin" }, { label: "Orders" }]}
      />
      <AdminPageHeader title="Orders" description="Search and manage customer orders." />
      <AdminOrdersPanel />
    </>
  );
}
