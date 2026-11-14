export default function ProductDetailLoading() {
  return (
    <div className="page-shell animate-pulse" aria-busy="true" aria-label="Loading product">
      <div className="product-detail">
        <div className="product-gallery bg-muted rounded-lg min-h-[420px]" />
        <div className="product-info space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-20 w-full bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-12 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
