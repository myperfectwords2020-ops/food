import { AccountAddressesManager } from "@/components/account/account-addresses-manager";
import { AccountShell } from "@/components/account/account-shell";
import { pageMetadata } from "@/lib/seo";
import { getAccountAddresses } from "@/modules/account/account.service";

export const metadata = pageMetadata("Addresses", "Manage delivery addresses.");

export default async function AccountAddressesPage() {
  const addresses = await getAccountAddresses();

  return (
    <AccountShell title="Addresses">
      <AccountAddressesManager addresses={addresses} />
    </AccountShell>
  );
}
