import { redirect } from "next/navigation";

import { AccountNotificationsList } from "@/components/account/account-notifications-list";
import { AccountShell } from "@/components/account/account-shell";
import { getRequestContext } from "@/lib/auth/request-context";
import { listCustomerNotifications } from "@/modules/notifications/notification.service";

export default async function AccountNotificationsPage() {
  const ctx = await getRequestContext();
  if (!ctx?.customerId || !ctx.tenantId) redirect("/account/login");

  const initial = await listCustomerNotifications(ctx.tenantId, ctx.customerId, 1, 20);

  return (
    <AccountShell title="Notifications">
      <AccountNotificationsList initial={initial} />
    </AccountShell>
  );
}
