import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminLeadsPanel } from "@/components/admin/lists/admin-leads-panel";

export default function AdminLeadsPage() {
  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Conversion-focused pipeline — visitor to repeat customer."
      />
      <AdminLeadsPanel />
    </>
  );
}
