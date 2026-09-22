export default function Loading() {
  return (
    <main className="flex-1 px-6 py-16 md:px-16" role="status">
      <div className="mx-auto max-w-(--breakpoint-xl)">
        <div className="mb-4 h-1 w-16 animate-pulse rounded bg-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading page…</p>
      </div>
    </main>
  );
}
