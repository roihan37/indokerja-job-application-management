import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      aria-label="IndoKerja beranda"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ArrowUpRight className="size-6" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        indo<span className="text-primary">kerja</span>
        <span className="text-primary">.</span>
      </span>
    </Link>
  );
}
