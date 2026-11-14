"use client";

import { AssistantRecommendationCard } from "@/components/assistant/assistant-recommendation-card";
import type { AssistantProductRef } from "@/types/assistant";
import { formatNaira } from "@/lib/format";

export function AssistantComparison({
  products,
  summary,
}: {
  products: AssistantProductRef[];
  summary: string;
}) {
  return (
    <div className="assistant-comparison">
      <p className="text-sm leading-7 text-muted-foreground mb-3">{summary}</p>
      <div className="assistant-comparison-table-wrap">
        <table className="data-table assistant-comparison-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Good for</th>
              <th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productId}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.concern}</td>
                <td>{formatNaira(p.displayPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 mt-4">
        {products.map((p) => (
          <AssistantRecommendationCard key={p.productId} product={p} />
        ))}
      </div>
    </div>
  );
}
