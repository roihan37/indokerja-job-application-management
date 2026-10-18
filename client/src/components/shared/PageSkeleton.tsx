import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Memuat data" className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-4 rounded-2xl border bg-card p-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
      <span className="sr-only">Memuat data…</span>
    </div>
  );
}
