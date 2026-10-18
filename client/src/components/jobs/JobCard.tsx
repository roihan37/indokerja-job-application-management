import { ArrowUpRight, BriefcaseBusiness, MapPin, Wallet } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { JOB_TYPE_LABELS, formatDate, formatSalary } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { JobSummary } from '@/types/api';

interface JobCardProps {
  job: JobSummary;
  selected: boolean;
  applied: boolean;
  discoverySearch: string;
  onSelect: (jobId: string) => void;
}

export function JobCard({
  job,
  selected,
  applied,
  discoverySearch,
  onSelect,
}: JobCardProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      window.matchMedia('(min-width: 1280px)').matches &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      onSelect(job.id);
    }
  }

  return (
    <article
      className={cn(
        'relative rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40',
        selected && 'xl:border-primary xl:bg-primary/[0.025]',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <BriefcaseBusiness aria-hidden="true" className="size-5" />
        </div>
        <p className="min-w-0 text-sm font-medium break-words text-muted-foreground">
          {job.company.name}
        </p>
      </div>
      <h3 className="text-lg leading-snug font-semibold tracking-tight break-words">
        <Link
          to={`/jobs/${encodeURIComponent(job.id)}`}
          state={{ discoverySearch }}
          onClick={handleClick}
          aria-current={selected ? 'true' : undefined}
          className="after:absolute after:inset-0 after:rounded-2xl hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
        >
          {job.title}
        </Link>
      </h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{job.location}</span>
        </p>
        <p className="flex items-start gap-2 text-foreground">
          <Wallet
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <span>
            {formatSalary(job.salary)}{' '}
            <span className="text-xs text-muted-foreground">/ bulan</span>
          </span>
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        {applied && (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Sudah dilamar
          </Badge>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
        <span>Dipublikasikan {formatDate(job.createdAt)}</span>
        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
      </div>
    </article>
  );
}
