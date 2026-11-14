export function AdminAccessibleChart({
  title,
  series,
  emptyMessage = "No chart data for this range.",
}: {
  title: string;
  series: { label: string; value: number }[];
  emptyMessage?: string;
}) {
  if (series.length === 0) {
    return (
      <div className="panel" role="status">
        <p className="text-sm text-muted-foreground m-0">{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(...series.map((s) => s.value), 1);

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{title}</figcaption>
      <div
        className="fake-chart"
        role="img"
        aria-label={`${title}: ${series.map((s) => `${s.label} ${s.value}`).join(", ")}`}
      >
        {series.map((bar) => (
          <i
            key={bar.label}
            style={{ height: `${Math.round((bar.value / max) * 100)}%` }}
            title={`${bar.label}: ${bar.value}`}
          />
        ))}
      </div>
      <ul className="flex justify-between text-xs text-muted-foreground mt-2 list-none p-0 m-0">
        {series.map((bar) => (
          <li key={bar.label}>{bar.label}</li>
        ))}
      </ul>
    </figure>
  );
}
