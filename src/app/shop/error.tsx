"use client";

export default function ShopError({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell">
      <div className="empty-state">
        <div className="empty-orbit" />
        <h3>We couldn&apos;t load the shop</h3>
        <p className="text-muted-foreground">Please try again in a moment.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
