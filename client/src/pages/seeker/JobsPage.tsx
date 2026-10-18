import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { JOB_TYPES, filterJobs } from '@/components/jobs/filterJobs';
import { JobFilters, MobileJobFilters } from '@/components/jobs/JobFilters';
import { DiscoverySkeleton, JobResults } from '@/components/jobs/JobResults';
import { JobSearch } from '@/components/jobs/JobSearch';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';
import { getMyApplications } from '@/services/applications.service';
import { getJobs } from '@/services/jobs.service';
import type { JobType } from '@/types/api';

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const location = searchParams.get('location') ?? '';
  const selectedTypes = JOB_TYPES.filter((jobType) =>
    (searchParams.get('type') ?? '').split(',').includes(jobType),
  );
  const jobs = useQuery({
    queryKey: queryKeys.jobs(),
    queryFn: ({ signal }) => getJobs(false, signal),
  });
  const applications = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: ({ signal }) => getMyApplications(signal),
  });
  const visibleJobs = filterJobs(
    jobs.data ?? [],
    keyword,
    location,
    selectedTypes,
  );
  const selectedJob =
    visibleJobs.find((job) => job.id === searchParams.get('selected')) ??
    visibleJobs[0];
  const appliedJobIds = new Set(
    applications.data?.map((application) => application.job.id),
  );
  const hasFilters = Boolean(keyword || location || selectedTypes.length);

  function handleSearch(nextKeyword: string, nextLocation: string) {
    const nextParams = new URLSearchParams(searchParams);
    const fields: [string, string][] = [
      ['keyword', nextKeyword],
      ['location', nextLocation],
    ];
    for (const [field, value] of fields) {
      if (value) {
        nextParams.set(field, value);
      } else {
        nextParams.delete(field);
      }
    }
    nextParams.delete('selected');
    setSearchParams(nextParams);
  }

  function handleTypesChange(types: JobType[]) {
    const nextParams = new URLSearchParams(searchParams);
    if (types.length > 0) {
      nextParams.set('type', types.join(','));
    } else {
      nextParams.delete('type');
    }
    nextParams.delete('selected');
    setSearchParams(nextParams);
  }

  function selectJob(jobId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('selected', jobId);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <>
      <JobSearch
        keyword={keyword}
        location={location}
        onSearch={handleSearch}
      />
      <div className="mx-auto grid max-w-[1440px] items-start gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8">
        <aside
          className="sticky top-24 hidden rounded-2xl border bg-card p-5 lg:block"
          aria-label="Filter lowongan"
        >
          <JobFilters
            jobs={jobs.data ?? []}
            selectedTypes={selectedTypes}
            onTypesChange={handleTypesChange}
          />
        </aside>
        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Lowongan tersedia
              </h2>
              {!jobs.isPending && !jobs.isError && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleJobs.length} lowongan ditemukan
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setSearchParams({})}
                >
                  Reset pencarian
                </Button>
              )}
              <MobileJobFilters
                jobs={jobs.data ?? []}
                selectedTypes={selectedTypes}
                onTypesChange={handleTypesChange}
              />
            </div>
          </div>
          {jobs.isPending ? <DiscoverySkeleton /> : null}
          {jobs.isError ? (
            <ErrorState
              error={jobs.error}
              onRetry={() => void jobs.refetch()}
            />
          ) : null}
          {!jobs.isPending && !jobs.isError && visibleJobs.length === 0 ? (
            <EmptyState
              title={
                hasFilters
                  ? 'Belum ada lowongan yang cocok'
                  : 'Belum ada lowongan tersedia'
              }
              description={
                hasFilters
                  ? 'Coba kata kunci atau lokasi lain, atau hapus filter untuk melihat semua lowongan.'
                  : 'Lowongan baru dari perusahaan akan muncul di sini.'
              }
            >
              {hasFilters && (
                <Button variant="outline" onClick={() => setSearchParams({})}>
                  Lihat semua lowongan
                </Button>
              )}
            </EmptyState>
          ) : null}
          {!jobs.isPending && !jobs.isError && selectedJob ? (
            <JobResults
              jobs={visibleJobs}
              selectedJobId={selectedJob.id}
              appliedJobIds={appliedJobIds}
              discoverySearch={searchParams.toString()}
              onSelect={selectJob}
            />
          ) : null}
        </main>
      </div>
    </>
  );
}
