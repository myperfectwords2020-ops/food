import { ShopProductGridSkeleton } from "@/components/shop/shop-product-grid-skeleton";

export default function ShopLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-live="polite">
      <p className="eyebrow">Shop</p>
      <h1 className="page-title">Fresh groceries, every day.</h1>
      <ShopProductGridSkeleton count={12} />
    </div>
  );
}
