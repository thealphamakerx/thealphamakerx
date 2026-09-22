import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div role="status" aria-label="Loading products" className="mx-auto w-full max-w-(--breakpoint-xl) px-6 py-12 md:px-16">
      <span className="sr-only">Loading products…</span>
      <Skeleton className="mb-8 h-8 w-48" />
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-border p-5">
            <Skeleton className="aspect-4/5 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
