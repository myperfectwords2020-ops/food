import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { formatNaira } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import {
  getAccountProfile,
  getAccountRecommendations,
  listAccountOrderSummaries,
} from "@/modules/account/account.service";

export const metadata = pageMetadata("Your account", "Manage your Greencart profile and orders.");

export default async function AccountPage() {
  const [profile, orders, recommendations] = await Promise.all([
    getAccountProfile(),
    listAccountOrderSummaries(),
    getAccountRecommendations(),
  ]);

  return (
    <AccountShell title={`Hello, ${profile.firstName}.`}>
      <div className="metric-grid">
        <div className="metric-card">
          <p>Orders</p>
          <strong>{orders.length}</strong>
        </div>
        <div className="metric-card">
          <p>Recommendations</p>
          <strong>{recommendations.length}</strong>
        </div>
        <div className="metric-card">
          <p>Latest order</p>
          <strong>{orders[0]?.id ?? "—"}</strong>
        </div>
        <div className="metric-card">
          <p>Spent</p>
          <strong>{orders[0] ? formatNaira(orders[0].total) : "—"}</strong>
        </div>
      </div>
      <div className="panel mt-8">
        <h2 className="text-lg font-bold">Quick links</h2>
        <div className="flex flex-wrap gap-4 mt-4 text-sm font-bold">
          <Link href="/account/orders">View orders</Link>
          <Link href="/account/recommendations">See recommendations</Link>
          <Link href="/routine">Retake routine quiz</Link>
        </div>
      </div>
    </AccountShell>
  );
}
