import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AutomationEditor } from "@/components/admin/automation-editor";

export default function AdminAutomationNewPage() {
  return (
    <>
      <AdminPageHeader title="New automation" description="Visual workflow — no arbitrary code." />
      <AutomationEditor mode="create" />
    </>
  );
}
