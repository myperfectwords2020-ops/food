import { AccountPreferencesForm } from "@/components/account/account-preferences-form";
import { AccountShell } from "@/components/account/account-shell";
import { pageMetadata } from "@/lib/seo";
import { getAccountPreferences } from "@/modules/account/account.service";

export const metadata = pageMetadata("Preferences", "Communication and routine preferences.");

export default async function AccountPreferencesPage() {
  const preferences = await getAccountPreferences();
  return (
    <AccountShell title="Preferences">
      <AccountPreferencesForm preferences={preferences} />
    </AccountShell>
  );
}
