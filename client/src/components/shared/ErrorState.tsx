import { CircleAlert, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/services/api';

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/20 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <CircleAlert
          className="mt-0.5 size-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-semibold">Data belum dapat ditampilkan</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {getErrorMessage(error)}
          </p>
          {onRetry && (
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Coba lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
