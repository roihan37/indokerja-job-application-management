import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { ApplyConfirmation } from '@/components/jobs/ApplyConfirmation';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError, getErrorMessage } from '@/services/api';
import { applyToJob, getMyApplications } from '@/services/applications.service';

interface ApplyJobButtonProps {
  jobId: string;
}

export function ApplyJobButton({ jobId }: ApplyJobButtonProps) {
  const queryClient = useQueryClient();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [conflictedJobId, setConflictedJobId] = useState<string | null>(null);
  const applications = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: ({ signal }) => getMyApplications(signal),
  });
  const apply = useMutation({
    mutationFn: ({ id, resumeId }: { id: string; resumeId?: string }) =>
      applyToJob(id, resumeId),
    onSuccess: async () => {
      setConfirmationOpen(false);
      toast.success('Lamaran berhasil dikirim. Semoga sukses!');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.myApplications,
      });
    },
    onError: async (error, appliedJobId) => {
      if (error instanceof ApiError && error.code === 'ALREADY_APPLIED') {
        setConflictedJobId(appliedJobId.id);
        setConfirmationOpen(false);
        toast.info('Anda sudah melamar lowongan ini.');
        await queryClient.invalidateQueries({
          queryKey: queryKeys.myApplications,
        });
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
  const alreadyApplied =
    applications.data?.some((application) => application.job.id === jobId) ||
    conflictedJobId === jobId ||
    (apply.isSuccess && apply.variables?.id === jobId);

  if (alreadyApplied) {
    return (
      <div className="space-y-3">
        <div
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <Check aria-hidden="true" className="size-4" />
          Lamaran sudah terkirim
        </div>
        <Link
          to="/applications"
          className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Pantau di Lamaran saya
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        className="min-h-11 w-full"
        disabled={
          apply.isPending || applications.isPending || applications.isError
        }
        onClick={() => setConfirmationOpen(true)}
      >
        {apply.isPending || applications.isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Send aria-hidden="true" className="size-4" />
        )}
        {apply.isPending ? 'Mengirim lamaran…' : 'Lamar sekarang'}
      </Button>
      <ApplyConfirmation
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        pending={apply.isPending}
        error={apply.isError ? getErrorMessage(apply.error) : undefined}
        onConfirm={(resumeId) => apply.mutate({ id: jobId, resumeId })}
      />
      {applications.isError ? (
        <div className="text-center text-sm text-destructive" role="alert">
          <p>Status lamaran belum dapat dimuat.</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => void applications.refetch()}
          >
            Coba lagi
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Lamaran dikirim menggunakan akun Anda yang sedang aktif.
        </p>
      )}
    </div>
  );
}
