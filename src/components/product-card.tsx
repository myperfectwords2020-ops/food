import Link from "next/link";

import { QuickAddButton } from "@/components/product/quick-add-button";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types/commerce";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock > 0;

  return (
    <article className="gc-card">
      <Link href={`/products/${product.slug}`} className="gc-card-media" tabIndex={-1} aria-hidden>
        <img src={product.image} alt="" loading="lazy" />
      </Link>
      {product.badge ? <span className="gc-card-badge">{product.badge}</span> : null}
      <p className="gc-card-category">{product.category}</p>
      <h3>
        <Link href={`/products/${product.slug}`}>{product.name}</Link>
      </h3>
      <p className="gc-card-stock">{inStock ? `${product.stock} in stock` : "Out of stock"}</p>
      <div className="gc-card-row">
        <p className="gc-card-price">{formatNaira(product.price)}</p>
        <QuickAddButton
          productId={product.id}
          label="Add"
          productName={product.name}
          disabled={!inStock}
        />
      </div>
    </article>
  );
}
