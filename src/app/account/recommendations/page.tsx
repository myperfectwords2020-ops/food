import { AccountShell } from "@/components/account/account-shell";
import { AccountRecommendationsList } from "@/components/account/account-recommendations-list";
import { EmptyState } from "@/components/page-ui";
import { RouteLink } from "@/components/ui/route-link";
import { pageMetadata } from "@/lib/seo";
import { getAccountRecommendationSets } from "@/modules/account/account.service";

export const metadata = pageMetadata(
  "Recommendations",
  "Personalized product guidance based on your preferences.",
);

export default async function AccountRecommendationsPage() {
  const sets = await getAccountRecommendationSets();
  const latest = sets[0];

  return (
    <AccountShell title="Recommendations">
      <p className="text-sm text-muted-foreground leading-7 mb-6">
        Based on your profile and routine preferences—not a medical diagnosis. Introduce products
        gradually and patch test.
      </p>
      {!latest ? (
        <EmptyState
          title="No saved recommendations yet"
          copy="Complete the routine consultation—we'll list personalized picks here once saved to your account."
        />
      ) : (
        <AccountRecommendationsList sets={sets} />
      )}
      <RouteLink href="/routine" className="mt-8 inline-flex">
        Refresh recommendations
      </RouteLink>
    </AccountShell>
  );
}
