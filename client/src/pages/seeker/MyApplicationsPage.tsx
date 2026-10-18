import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
} from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getMyApplications } from '@/services/applications.service';

export function MyApplicationsPage() {
  const applications = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: ({ signal }) => getMyApplications(signal),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-primary uppercase">
            Perjalanan karier Anda
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Lamaran saya
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pantau status terbaru dari setiap lowongan yang Anda lamar.
          </p>
        </div>
        <Button variant="outline" className="min-h-11" asChild>
          <Link to="/jobs">
            <Search aria-hidden="true" className="size-4" />
            Cari lowongan
          </Link>
        </Button>
      </div>

      {applications.isPending ? (
        <div className="space-y-4" role="status" aria-label="Memuat lamaran">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border bg-card p-6"
            >
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      ) : null}
      {applications.isError ? (
        <ErrorState
          error={applications.error}
          onRetry={() => void applications.refetch()}
        />
      ) : null}
      {applications.data?.length === 0 ? (
        <EmptyState
          title="Lamaran pertama Anda dimulai di sini"
          description="Temukan lowongan yang sesuai, kirim lamaran, lalu pantau perkembangannya di halaman ini."
        >
          <Button asChild>
            <Link to="/jobs">
              Jelajahi lowongan{' '}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </EmptyState>
      ) : null}
      {applications.data && applications.data.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {applications.data.length} lamaran terkirim
          </p>
          {applications.data.map((application) => (
            <article
              key={application.id}
              className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex min-w-0 gap-3 sm:gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <BriefcaseBusiness aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-sm break-words text-muted-foreground">
                      {application.job.company.name}
                    </p>
                    <h2 className="text-lg leading-snug font-semibold">
                      <Link
                        className="break-words underline-offset-4 hover:text-primary hover:underline"
                        to={`/jobs/${encodeURIComponent(application.job.id)}`}
                      >
                        {application.job.title}
                      </Link>
                    </h2>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0 break-words">
                        {application.job.location}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={application.status} />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  Dilamar {formatDate(application.createdAt)}
                </span>
                <span>Diperbarui {formatDate(application.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}
