"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteAccountRecommendationAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { RouteLink } from "@/components/ui/route-link";
import type { AccountRecommendationSet } from "@/types/commerce";

export function AccountRecommendationsList({ sets }: { sets: AccountRecommendationSet[] }) {
  const router = useRouter();

  return (
    <ul className="space-y-6">
      {sets.map((set) => (
        <li key={set.id} className="panel space-y-3">
          <div className="flex justify-between items-start gap-4">
            <p className="text-xs text-muted-foreground">
              Saved {new Date(set.createdAt).toLocaleString()}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                const result = await deleteAccountRecommendationAction(set.id);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Recommendation removed.");
                  router.refresh();
                }
              }}
            >
              Remove
            </Button>
          </div>
          <ul className="space-y-3">
            {set.products.map((p) => (
              <li key={`${set.id}-${p.slug}`} className="flex justify-between items-center gap-4">
                <div>
                  <Link href={`/products/${p.slug}`} className="font-bold text-sm">
                    {p.name}
                  </Link>
                  {p.reasons.length ? (
                    <p className="text-xs text-muted-foreground mt-1">{p.reasons.join(" · ")}</p>
                  ) : null}
                </div>
                <RouteLink href={`/products/${p.slug}`} variant="outline" size="sm">
                  View
                </RouteLink>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
