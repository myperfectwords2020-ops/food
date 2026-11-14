import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCustomersPanel } from "@/components/admin/lists/admin-customers-panel";

export default function AdminCustomersPage() {
  return (
    <>
      <AdminPageHeader title="Customers" description="Profiles, spend, and lifecycle stage." />
      <AdminCustomersPanel />
    </>
  );
}
