export function AdminMockBanner({ label = "Mock data" }: { label?: string }) {
  return (
    <p
      className="text-xs text-muted-foreground border border-dashed border-border px-3 py-2 mb-4"
      role="note"
    >
      {label} — figures are isolated demo samples until the Admin API is connected. Not production
      analytics.
    </p>
  );
}
