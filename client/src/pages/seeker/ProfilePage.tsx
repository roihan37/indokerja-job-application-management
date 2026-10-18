import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ResumeActions } from '@/components/profile/ResumeActions';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/services/api';
import {
  getMyProfile,
  getOwnResumeUrl,
  updateMyProfile,
  uploadResume,
} from '@/services/profile.service';

import {
  type ProfileFormInput,
  profileSchema,
  validateResume,
} from './profile.schema';

const fields = [
  ['fullName', 'Nama lengkap'],
  ['phone', 'Nomor telepon'],
  ['location', 'Lokasi'],
  ['headline', 'Headline profesional'],
  ['summary', 'Ringkasan profesional'],
] as const;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getMyProfile(signal),
  });
  const values = Object.fromEntries(
    fields.map(([name]) => [name, profile.data?.profile?.[name] ?? '']),
  ) as ProfileFormInput;
  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    values,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const save = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data);
      toast.success('Profil berhasil disimpan.');
    },
  });
  const upload = useMutation({
    mutationFn: uploadResume,
    onSuccess: async () => {
      setFile(null);
      toast.success(
        'CV berhasil diunggah. Lampiran lamaran sebelumnya tetap tersimpan.',
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resumes }),
      ]);
    },
  });
  if (profile.isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PageSkeleton />
      </div>
    );
  }
  if (profile.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          error={profile.error}
          onRetry={() => void profile.refetch()}
        />
      </div>
    );
  }
  const resume = profile.data.currentResume;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold">Profil saya</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lengkapi informasi profesional Anda untuk membantu perusahaan mengenal
          Anda.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Informasi pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => save.mutate(data))}
            className="grid gap-5 sm:grid-cols-2"
            noValidate
          >
            {fields.map(([name, label]) => (
              <div
                key={name}
                className={
                  name === 'summary' || name === 'headline'
                    ? 'space-y-2 sm:col-span-2'
                    : 'space-y-2'
                }
              >
                <Label htmlFor={name}>{label}</Label>
                {name === 'summary' ? (
                  <Textarea
                    id={name}
                    rows={5}
                    {...form.register(name)}
                    aria-invalid={Boolean(form.formState.errors[name])}
                    aria-describedby={
                      form.formState.errors[name] ? `${name}-error` : undefined
                    }
                  />
                ) : (
                  <Input
                    id={name}
                    type={name === 'phone' ? 'tel' : 'text'}
                    {...form.register(name)}
                    aria-invalid={Boolean(form.formState.errors[name])}
                    aria-describedby={
                      form.formState.errors[name] ? `${name}-error` : undefined
                    }
                  />
                )}
                {form.formState.errors[name] && (
                  <p
                    id={`${name}-error`}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {form.formState.errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-3 sm:col-span-2">
              {save.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {getErrorMessage(save.error)}
                </p>
              )}
              {save.isSuccess && (
                <p role="status" className="text-sm text-emerald-700">
                  Profil berhasil disimpan.
                </p>
              )}
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Menyimpan…' : 'Simpan profil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Curriculum vitae (CV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {resume ? (
            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-medium wrap-anywhere">{resume.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {(resume.fileSize / 1024).toFixed(1)} KB · Diunggah{' '}
                {formatDate(resume.createdAt)}
              </p>
              <ResumeActions
                requestUrl={(download) => getOwnResumeUrl(resume.id, download)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada CV. Unggah PDF untuk dilampirkan saat melamar.
            </p>
          )}
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (file && !fileError) {
                upload.mutate(file);
              }
            }}
          >
            <Label htmlFor="resume-file">
              {resume ? 'Unggah versi CV baru' : 'Unggah CV'}
            </Label>
            <Input
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              disabled={upload.isPending}
              aria-describedby="resume-help"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setFileError(selected ? (validateResume(selected) ?? '') : '');
                upload.reset();
              }}
            />
            <p id="resume-help" className="text-xs text-muted-foreground">
              PDF, maksimal 5 MB. Versi baru tidak mengganti CV pada lamaran
              yang sudah terkirim.
            </p>
            {fileError && (
              <p role="alert" className="text-sm text-destructive">
                {fileError}
              </p>
            )}
            {upload.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getErrorMessage(upload.error)}
              </p>
            )}
            {upload.isSuccess && (
              <p role="status" className="text-sm text-emerald-700">
                CV berhasil diunggah.
              </p>
            )}
            <Button
              type="submit"
              disabled={!file || Boolean(fileError) || upload.isPending}
            >
              {upload.isPending ? 'Mengunggah…' : 'Unggah CV'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
