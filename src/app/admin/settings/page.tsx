import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { adminService } from "@/services/index";

export default async function AdminSettingsPage() {
  const settings = await adminService.getSettings();

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Business, integrations, AI, and team — prototype until settings API ships."
      />
      <AdminSettingsForm settings={settings} />
    </>
  );
}
