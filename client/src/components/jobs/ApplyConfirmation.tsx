import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { queryKeys } from '@/lib/queryKeys';
import { getMyResumes } from '@/services/profile.service';

interface ApplyConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error?: string;
  onConfirm: (resumeId?: string) => void;
}

export function ApplyConfirmation({
  open,
  onOpenChange,
  pending,
  error,
  onConfirm,
}: ApplyConfirmationProps) {
  const resumes = useQuery({
    queryKey: queryKeys.resumes,
    queryFn: ({ signal }) => getMyResumes(signal),
    enabled: open,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ?? resumes.data?.[0]?.id ?? 'none';
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          onOpenChange(next);
        }
      }}
    >
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Kirim lamaran?</AlertDialogTitle>
          <AlertDialogDescription>
            Pilih CV yang ingin dilampirkan. CV pada lamaran ini tidak berubah
            ketika Anda mengunggah versi baru.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {resumes.isPending && (
          <p role="status" className="text-sm">
            Memuat CV…
          </p>
        )}
        {resumes.isError && (
          <div role="alert" className="text-sm text-destructive">
            CV belum dapat dimuat.{' '}
            <Button variant="link" onClick={() => void resumes.refetch()}>
              Coba lagi
            </Button>
          </div>
        )}
        {resumes.isSuccess && (
          <div className="space-y-3">
            {resumes.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Anda belum mengunggah CV. Anda dapat melamar tanpa CV atau
                mengunggahnya terlebih dahulu.
              </p>
            )}
            <Label htmlFor="application-resume">CV untuk lamaran ini</Label>
            <Select
              value={selected}
              onValueChange={setSelectedId}
              disabled={pending}
            >
              <SelectTrigger id="application-resume" className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa CV</SelectItem>
                {resumes.data.map((resume, index) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.fileName}
                    {index === 0 ? ' (terbaru)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link
              to="/profile"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Kelola profil dan unggah CV
            </Link>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button
            disabled={pending || !resumes.isSuccess}
            onClick={() =>
              onConfirm(selected === 'none' ? undefined : selected)
            }
          >
            {pending ? 'Mengirim lamaran…' : 'Ya, kirim lamaran'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
