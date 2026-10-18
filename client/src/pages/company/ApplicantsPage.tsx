import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { ApplicantStatusControl } from '@/components/applications/ApplicantStatusControl';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JOB_TYPE_LABELS, formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getJobApplicants } from '@/services/applications.service';
import { getJob } from '@/services/jobs.service';

export function ApplicantsPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const applicantsQuery = useQuery({
    queryKey: queryKeys.applicants(jobId),
    queryFn: ({ signal }) => getJobApplicants(jobId, signal),
    enabled: Boolean(jobId),
  });
  const jobQuery = useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: ({ signal }) => getJob(jobId, signal),
    enabled: Boolean(jobId) && applicantsQuery.isSuccess,
  });

  return (
    <div className="space-y-7">
      <Link
        to="/company/jobs"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke lowongan
      </Link>
      <header>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Kelola kandidat
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pelamar lowongan
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tinjau lamaran dan perbarui status setiap kandidat.
        </p>
      </header>

      {applicantsQuery.isPending && <PageSkeleton />}
      {applicantsQuery.isError && (
        <ErrorState
          error={applicantsQuery.error}
          onRetry={() => void applicantsQuery.refetch()}
        />
      )}
      {applicantsQuery.isSuccess && (
        <>
          {jobQuery.isPending && <PageSkeleton />}
          {jobQuery.isError && (
            <ErrorState
              error={jobQuery.error}
              onRetry={() => void jobQuery.refetch()}
            />
          )}
          {jobQuery.isSuccess && (
            <Card className="border-primary/10 bg-primary/5 shadow-none">
              <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold wrap-anywhere">
                    {jobQuery.data.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="wrap-anywhere">
                        {jobQuery.data.location}
                      </span>
                    </span>
                    <Badge variant="outline" className="bg-background">
                      {JOB_TYPE_LABELS[jobQuery.data.jobType]}
                    </Badge>
                  </div>
                </div>
                <div className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                  <UsersRound className="size-4" aria-hidden="true" />
                  {applicantsQuery.data.length} pelamar
                </div>
              </CardContent>
            </Card>
          )}

          {applicantsQuery.data.length === 0 ? (
            <EmptyState
              title="Belum ada lamaran masuk"
              description="Kandidat yang melamar lowongan ini akan muncul di sini. Anda dapat meninjau dan memperbarui status mereka."
            />
          ) : (
            <section aria-labelledby="applicants-heading">
              <h2 id="applicants-heading" className="mb-4 font-semibold">
                Daftar pelamar
              </h2>
              <Card className="overflow-hidden py-0 shadow-none">
                <CardContent className="px-0">
                  <ul className="divide-y">
                    {applicantsQuery.data.map((application) => (
                      <li key={application.id} className="p-5 sm:p-6">
                        <article className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 space-y-3">
                            <h3 className="text-sm font-semibold wrap-anywhere sm:text-base">
                              {application.jobSeeker.profile?.fullName ||
                                application.jobSeeker.email}
                            </h3>
                            {application.jobSeeker.profile?.fullName && (
                              <p className="text-sm text-muted-foreground wrap-anywhere">
                                {application.jobSeeker.email}
                              </p>
                            )}
                            {application.jobSeeker.profile?.headline && (
                              <p className="text-sm wrap-anywhere">
                                {application.jobSeeker.profile.headline}
                              </p>
                            )}
                            <Link
                              to={`/company/applications/${application.id}`}
                              className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Lihat profil
                            </Link>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarDays
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                Melamar {formatDate(application.createdAt)}
                              </span>
                              <StatusBadge status={application.status} />
                            </div>
                          </div>
                          <ApplicantStatusControl
                            application={application}
                            jobId={jobId}
                          />
                        </article>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
