export function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border-border bg-card p-4">
      <div className="mb-3 aspect-4/3 w-full rounded-lg bg-secondary" />
      <div className="mb-1 h-4 w-2/3 rounded bg-muted" />
      <div className="mb-3 h-3 w-1/2 rounded bg-muted" />
      <div className="h-4 w-1/3 rounded bg-muted" />
    </div>
  );
}
