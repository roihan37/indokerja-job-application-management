import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import { JobDetails } from '@/components/jobs/JobDetails';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';
import { getJob } from '@/services/jobs.service';

function getDiscoverySearch(state: unknown, jobId: string) {
  if (
    typeof state === 'object' &&
    state !== null &&
    'discoverySearch' in state &&
    typeof state.discoverySearch === 'string'
  ) {
    const searchParams = new URLSearchParams(state.discoverySearch);
    searchParams.set('selected', jobId);
    return searchParams.toString();
  }
  return new URLSearchParams({ selected: jobId }).toString();
}

export function JobDetailPage() {
  const { jobId = '' } = useParams();
  const location = useLocation();
  const job = useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: ({ signal }) => getJob(jobId, signal),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Button asChild variant="ghost" className="mb-5 -ml-3">
        <Link to={`/jobs?${getDiscoverySearch(location.state, jobId)}`}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke lowongan
        </Link>
      </Button>
      {job.isPending ? <PageSkeleton /> : null}
      {job.isError ? (
        <ErrorState error={job.error} onRetry={() => void job.refetch()} />
      ) : null}
      {job.data ? (
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_230px]">
          <JobDetails job={job.data} />
          <aside className="rounded-2xl border bg-card p-5">
            <ShieldCheck
              aria-hidden="true"
              className="mb-3 size-6 text-primary"
            />
            <h2 className="text-sm font-semibold">Melamar dengan aman</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Proses melamar di IndoKerja tidak dipungut biaya. Jaga data
              pribadi Anda selama proses rekrutmen.
            </p>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
