"use client";

import Link from "next/link";

import { recordAssistantRecommendationClickAction } from "@/app/actions/analytics-events";
import { QuickAddButton } from "@/components/product/quick-add-button";
import { formatNaira } from "@/lib/format";
import type { AssistantProductRef } from "@/types/assistant";

export function AssistantRecommendationCard({ product }: { product: AssistantProductRef }) {
  return (
    <article className="assistant-product-card panel">
      <div className="assistant-product-row">
        <img src={product.image} alt="" width={56} height={68} className="object-cover" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{product.category}</p>
          <h4 className="text-sm font-bold">
            <Link
              href={`/products/${product.slug}`}
              onClick={() =>
                void recordAssistantRecommendationClickAction({ productId: product.productId })
              }
            >
              {product.name}
            </Link>
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{product.concern}</p>
          <strong className="text-xs">{formatNaira(product.displayPrice)}</strong>
        </div>
      </div>
      {product.reason ? (
        <p className="text-xs text-muted-foreground leading-6 mt-3">{product.reason}</p>
      ) : null}
      <div className="flex gap-2 mt-3 items-center">
        <QuickAddButton productId={product.productId} analyticsSource="assistant" />
        <Link
          href={`/products/${product.slug}`}
          className="text-xs font-bold"
          onClick={() =>
            void recordAssistantRecommendationClickAction({ productId: product.productId })
          }
        >
          View details
        </Link>
      </div>
    </article>
  );
}
