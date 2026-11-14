import { notFound } from "next/navigation";

import { EmptyState, PageIntro } from "@/components/page-ui";
import { ProductCard } from "@/components/product-card";
import { catalogService } from "@/services/index";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug.replaceAll("-", " ");
  const { items, total } = await catalogService.listProducts({
    concern: name,
    pageSize: 24,
  });

  if (total === 0) {
    const fallback = await catalogService.listProducts({ pageSize: 6 });
    if (fallback.total === 0) notFound();
  }

  const products = total > 0 ? items : (await catalogService.listProducts({ pageSize: 6 })).items;

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Shop by concern"
        title={name.charAt(0).toUpperCase() + name.slice(1)}
        copy="A considered edit based on product information commonly associated with this beauty priority."
      />
      {products.length === 0 ? (
        <EmptyState
          title="No products in this edit yet"
          copy="Browse the full collection while we expand this category."
        />
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      )}
    </div>
  );
}
