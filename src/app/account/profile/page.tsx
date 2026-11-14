import { AccountProfileForm } from "@/components/account/account-profile-form";
import { AccountShell } from "@/components/account/account-shell";
import { pageMetadata } from "@/lib/seo";
import { getAccountProfile } from "@/modules/account/account.service";

export const metadata = pageMetadata("Profile", "Update your Greencart profile.");

export default async function AccountProfilePage() {
  const profile = await getAccountProfile();
  return (
    <AccountShell title="Profile">
      <AccountProfileForm profile={profile} />
    </AccountShell>
  );
}
