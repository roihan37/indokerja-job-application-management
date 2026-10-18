import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JOB_TYPE_LABELS, formatDate, formatSalary } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getJobs } from '@/services/jobs.service';

export function CompanyJobsPage() {
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs(true),
    queryFn: ({ signal }) => getJobs(true, signal),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Rekrutmen perusahaan
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Lowongan Anda
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Kelola lowongan dan temukan kandidat yang tepat untuk tim Anda.
          </p>
        </div>
        <Button asChild className="min-h-11 shrink-0">
          <Link to="/company/jobs/new">
            <Plus aria-hidden="true" />
            Buat lowongan
          </Link>
        </Button>
      </header>

      {jobsQuery.isPending && <PageSkeleton />}
      {jobsQuery.isError && (
        <ErrorState
          error={jobsQuery.error}
          onRetry={() => void jobsQuery.refetch()}
        />
      )}
      {jobsQuery.isSuccess && jobsQuery.data.length === 0 && (
        <EmptyState
          title="Lowongan pertama Anda dimulai di sini"
          description="Publikasikan posisi yang sedang dibutuhkan agar kandidat dapat mengirimkan lamaran."
        >
          <Button asChild>
            <Link to="/company/jobs/new">
              <Plus aria-hidden="true" />
              Buat lowongan
            </Link>
          </Button>
        </EmptyState>
      )}
      {jobsQuery.isSuccess && jobsQuery.data.length > 0 && (
        <section aria-labelledby="company-jobs-heading">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="company-jobs-heading" className="font-semibold">
              Semua lowongan
            </h2>
            <Badge variant="secondary">{jobsQuery.data.length}</Badge>
          </div>
          <Card className="overflow-hidden py-0 shadow-none">
            <CardContent className="px-0">
              <ul className="divide-y">
                {jobsQuery.data.map((job) => (
                  <li key={job.id} className="p-5 sm:p-6">
                    <article className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                          <BriefcaseBusiness
                            className="size-5"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 space-y-3">
                          <div>
                            <h3 className="text-base font-semibold wrap-anywhere">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">
                              {job.company.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <MapPin
                                className="size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="wrap-anywhere">
                                {job.location}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays
                                className="size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              {formatDate(job.createdAt)}
                            </span>
                            <Badge variant="outline">
                              {JOB_TYPE_LABELS[job.jobType]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between xl:shrink-0 xl:gap-6 xl:border-0 xl:pt-0">
                        <div className="text-sm">
                          <p className="font-semibold">
                            {formatSalary(job.salary)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            per bulan
                          </p>
                        </div>
                        <Button asChild variant="outline" className="min-h-11">
                          <Link to={`/company/jobs/${job.id}/applicants`}>
                            Lihat pelamar
                            <ArrowUpRight aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
