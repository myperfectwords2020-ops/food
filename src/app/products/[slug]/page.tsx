import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck, Star } from "lucide-react";

import { AddToCartControl } from "@/components/product/add-to-cart-control";
import { ShadeSelector } from "@/components/product/shade-selector";
import { ProductViewTracker } from "@/components/product/product-view-tracker";
import { ProductCard } from "@/components/product-card";
import { formatNaira } from "@/lib/format";
import { catalogService } from "@/services/index";

function formatDietaryTags(tags: string[]) {
  const normalized = tags.filter((t) => t.toLowerCase() !== "all skin types");
  if (normalized.length === 0) return null;
  return normalized.join(", ");
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await catalogService.getProductBySlug(slug);
  if (!product) notFound();

  const inStock = product.stock > 0;
  const dietary = formatDietaryTags(product.skinTypes);

  return (
    <article className="page-shell gc-product">
      <ProductViewTracker productId={product.id} />
      <div className="product-detail gc-product-layout">
        <figure className="product-gallery gc-product-gallery">
          <Image
            src={product.image}
            alt={product.name}
            width={960}
            height={960}
            priority
            className="gc-product-hero"
          />
        </figure>
        <div className="product-info gc-product-main">
          <header className="gc-product-header">
            <p className="gc-product-eyebrow">
              {product.category} · Good for {product.concern.toLowerCase()}
            </p>
            <h1>{product.name}</h1>
            <p className="gc-product-rating">
              <span className="gc-product-stars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill="currentColor" />
                ))}
              </span>
              <span className="sr-only">Rated 5 out of 5 based on customer feedback</span>
              <span>124 shopper reviews</span>
            </p>
          </header>

          <p className="product-description gc-product-lede">{product.description}</p>

          <section className="gc-product-buy" aria-label="Purchase">
            <p className="product-price gc-product-price">{formatNaira(product.price)}</p>
            {product.shadeOptions ? (
              <div className="gc-product-shade">
                <ShadeSelector shades={product.shadeOptions} productName={product.name} />
              </div>
            ) : null}
            {inStock ? (
              <AddToCartControl
                productId={product.id}
                unitPrice={product.price}
                maxQuantity={product.stock}
                showBuyNow
              />
            ) : (
              <p className="text-sm font-bold text-danger">Currently unavailable</p>
            )}
            <p className="gc-product-stock">
              <ShieldCheck size={15} aria-hidden />
              {inStock
                ? `In stock (${product.stock}) · Dispatches within 1–2 business days`
                : "Out of stock · Check back soon"}
            </p>
          </section>

          <section className="gc-product-specs" aria-labelledby="product-specs-heading">
            <h2 id="product-specs-heading" className="gc-product-specs-title">
              Product details
            </h2>
            <dl className="gc-product-spec-grid">
              <div className="gc-product-spec-row">
                <dt>Dietary</dt>
                <dd>{dietary ?? "See label for allergen and dietary information."}</dd>
              </div>
              <div className="gc-product-spec-row">
                <dt>Good for</dt>
                <dd>{product.concern}</dd>
              </div>
            </dl>
            <p className="gc-product-disclaimer">
              Suggestions use catalog information only—not medical or nutrition advice. Always check
              the label for allergens.
            </p>
          </section>

          <div className="detail-list gc-product-accordions">
            {product.ingredients.length > 0 ? (
              <details>
                <summary>Ingredients</summary>
                <p>{product.ingredients.join(" · ")}</p>
              </details>
            ) : null}
            {product.usageInstructions ? (
              <details>
                <summary>How to use</summary>
                <p>{product.usageInstructions}</p>
              </details>
            ) : null}
            {product.warnings ? (
              <details>
                <summary>Storage &amp; safety</summary>
                <p>{product.warnings}</p>
              </details>
            ) : null}
          </div>

          <Link href="/assistant" className="gc-product-assistant-link">
            Not sure? Ask the Greencart assistant for meal ideas or alternatives →
          </Link>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProductRecommendations slug={slug} />
      </Suspense>
    </article>
  );
}

async function ProductRecommendations({ slug }: { slug: string }) {
  const related = await catalogService.getRelatedProducts(slug, 3);

  if (related.length === 0) return null;

  return (
    <section className="gc-section gc-product-related" aria-labelledby="related-products-heading">
      <div className="gc-wrap">
        <header className="gc-section-head">
          <h2 id="related-products-heading" className="gc-h2">
            You might also like
          </h2>
        </header>
        <div className="shop-grid">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
