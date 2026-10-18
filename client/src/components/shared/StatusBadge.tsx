import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUS_LABELS } from '@/lib/format';
import type { ApplicationStatus } from '@/types/api';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: 'border-slate-200 bg-slate-100 text-slate-700',
  Reviewing: 'border-blue-200 bg-blue-50 text-blue-700',
  Shortlisted: 'border-amber-200 bg-amber-50 text-amber-800',
  Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  Accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
