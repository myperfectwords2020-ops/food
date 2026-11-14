import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminInventoryPanel } from "@/components/admin/lists/admin-inventory-panel";

export default function AdminInventoryPage() {
  return (
    <>
      <AdminPageHeader title="Inventory" description="Stock levels and audited adjustments." />
      <AdminInventoryPanel />
    </>
  );
}
