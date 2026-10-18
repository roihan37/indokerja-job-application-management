import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPLICATION_STATUS_LABELS } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getSession } from '@/lib/session';
import { getErrorMessage } from '@/services/api';
import { updateApplicationStatus } from '@/services/applications.service';
import type { ApplicationStatus, JobApplicant } from '@/types/api';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Reviewing',
  'Shortlisted',
  'Rejected',
  'Accepted',
];

interface ApplicantStatusControlProps {
  application: JobApplicant;
  jobId: string;
}

export function ApplicantStatusControl({
  application,
  jobId,
}: ApplicantStatusControlProps) {
  const queryClient = useQueryClient();
  const [desiredStatus, setDesiredStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const selectedStatus = desiredStatus ?? application.status;
  const updateMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      updateApplicationStatus(application.id, status),
    onMutate: () => getSession()?.accessToken,
    onSuccess: async (updatedApplication, _status, initiatingToken) => {
      if (getSession()?.accessToken !== initiatingToken) {
        return;
      }
      queryClient.setQueryData<JobApplicant[]>(
        queryKeys.applicants(jobId),
        (applications) =>
          applications?.map((currentApplication) =>
            currentApplication.id === updatedApplication.id
              ? { ...currentApplication, status: updatedApplication.status }
              : currentApplication,
          ),
      );
      setDesiredStatus(null);
      toast.success('Status lamaran berhasil diperbarui.');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applicants(jobId),
      });
    },
    onError: (error, _status, initiatingToken) => {
      if (getSession()?.accessToken !== initiatingToken) {
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });

  function selectStatus(value: string) {
    const status = APPLICATION_STATUSES.find((item) => item === value);
    if (status) {
      setDesiredStatus(status);
      updateMutation.reset();
    }
  }

  function requestUpdate() {
    if (updateMutation.isPending || selectedStatus === application.status) {
      return;
    }
    if (selectedStatus === 'Accepted' || selectedStatus === 'Rejected') {
      setConfirmationOpen(true);
      return;
    }
    updateMutation.mutate(selectedStatus);
  }

  return (
    <div className="w-full space-y-2 xl:max-w-80">
      <div className="flex gap-2">
        <Select
          value={selectedStatus}
          onValueChange={selectStatus}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger
            className="min-h-11 min-w-0 flex-1"
            aria-label={`Status lamaran ${application.jobSeeker.email}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0"
          disabled={
            updateMutation.isPending || selectedStatus === application.status
          }
          onClick={requestUpdate}
          aria-label={`Simpan status lamaran ${application.jobSeeker.email}`}
        >
          {updateMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          <span>{updateMutation.isPending ? 'Menyimpan…' : 'Simpan'}</span>
        </Button>
      </div>
      {updateMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(updateMutation.error)}
        </p>
      )}

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ubah status menjadi {APPLICATION_STATUS_LABELS[selectedStatus]}?
            </AlertDialogTitle>
            <AlertDialogDescription className="wrap-anywhere">
              Lamaran {application.jobSeeker.email} akan diperbarui. Kandidat
              dapat melihat status terbaru pada halaman lamaran mereka.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateMutation.mutate(selectedStatus)}
            >
              Ya, perbarui status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
