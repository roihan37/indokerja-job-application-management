import { useQuery } from '@tanstack/react-query';

import { JobCard } from '@/components/jobs/JobCard';
import { JobDetails } from '@/components/jobs/JobDetails';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/queryKeys';
import { getJob } from '@/services/jobs.service';
import type { JobSummary } from '@/types/api';

interface JobResultsProps {
  jobs: JobSummary[];
  selectedJobId: string;
  appliedJobIds: Set<string>;
  discoverySearch: string;
  onSelect: (jobId: string) => void;
}

export function JobResults({
  jobs,
  selectedJobId,
  appliedJobIds,
  discoverySearch,
  onSelect,
}: JobResultsProps) {
  const selectedDetail = useQuery({
    queryKey: queryKeys.job(selectedJobId),
    queryFn: ({ signal }) => getJob(selectedJobId, signal),
  });

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="min-w-0 space-y-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            selected={selectedJobId === job.id}
            applied={appliedJobIds.has(job.id)}
            discoverySearch={discoverySearch}
            onSelect={onSelect}
          />
        ))}
      </div>
      <aside
        className="sticky top-24 hidden min-w-0 xl:block"
        aria-label="Detail lowongan terpilih"
      >
        {selectedDetail.isPending ? (
          <div
            className="space-y-5 rounded-2xl border bg-card p-7"
            role="status"
            aria-label="Memuat detail lowongan"
          >
            <Skeleton className="size-12 rounded-xl" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}
        {selectedDetail.isError ? (
          <ErrorState
            error={selectedDetail.error}
            onRetry={() => void selectedDetail.refetch()}
          />
        ) : null}
        {selectedDetail.data ? (
          <JobDetails
            job={selectedDetail.data}
            compact
            discoverySearch={discoverySearch}
          />
        ) : null}
      </aside>
    </div>
  );
}

export function DiscoverySkeleton() {
  return (
    <div
      className="grid gap-5 xl:grid-cols-2"
      role="status"
      aria-label="Memuat lowongan"
    >
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-4 rounded-2xl border bg-card p-5">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="hidden space-y-5 rounded-2xl border bg-card p-7 xl:block">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mt-8 h-32 w-full" />
      </div>
    </div>
  );
}
