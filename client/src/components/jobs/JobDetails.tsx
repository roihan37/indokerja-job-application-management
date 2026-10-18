import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router';

import { ApplyJobButton } from '@/components/jobs/ApplyJobButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { JOB_TYPE_LABELS, formatDate, formatSalary } from '@/lib/format';
import type { JobDetail } from '@/types/api';

interface JobDetailsProps {
  job: JobDetail;
  compact?: boolean;
  discoverySearch?: string;
}

export function JobDetails({
  job,
  compact = false,
  discoverySearch,
}: JobDetailsProps) {
  const headingClassName = compact
    ? 'text-2xl leading-tight font-bold tracking-tight break-words'
    : 'text-2xl leading-tight font-bold tracking-tight break-words sm:text-3xl';
  const DescriptionHeading = compact ? 'h3' : 'h2';

  return (
    <div className="min-w-0 rounded-2xl border bg-card shadow-xs">
      <div className="p-6 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-primary/5 text-primary">
            <BriefcaseBusiness aria-hidden="true" className="size-6" />
          </div>
          <p className="min-w-0 text-sm font-medium break-words text-muted-foreground">
            {job.company.name}
          </p>
        </div>
        {compact ? (
          <h2 className={headingClassName}>{job.title}</h2>
        ) : (
          <h1 className={headingClassName}>{job.title}</h1>
        )}
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{job.location}</span>
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        </div>
        <div className="my-6 rounded-xl bg-muted/60 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Wallet aria-hidden="true" className="size-4" /> Gaji per bulan
          </p>
          <p className="text-xl font-semibold tracking-tight">
            {formatSalary(job.salary)}
          </p>
        </div>
        <ApplyJobButton key={job.id} jobId={job.id} />
      </div>
      <Separator />
      <div className="space-y-5 p-6 sm:p-7">
        <div>
          <DescriptionHeading className="mb-3 text-base font-semibold">
            Tentang lowongan
          </DescriptionHeading>
          {job.description?.trim() ? (
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-muted-foreground">
              {job.description}
            </p>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              Perusahaan belum menambahkan deskripsi untuk lowongan ini.
            </p>
          )}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
          Dipublikasikan {formatDate(job.createdAt)}
        </p>
        {compact && (
          <Button variant="outline" className="w-full" asChild>
            <Link
              to={`/jobs/${encodeURIComponent(job.id)}`}
              state={{ discoverySearch }}
            >
              Buka detail lowongan{' '}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
