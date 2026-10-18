import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Info, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { JOB_TYPE_LABELS } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getSession } from '@/lib/session';
import { ApiError, getErrorMessage } from '@/services/api';
import { createJob } from '@/services/jobs.service';
import type { JobType } from '@/types/api';

import { type CreateJobFormValues, createJobSchema } from './createJob.schema';

const JOB_TYPES: JobType[] = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
];

export function CreateJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMounted = useRef(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: '',
      location: '',
      jobType: 'FULL_TIME',
      description: '',
    },
  });
  const createMutation = useMutation({
    mutationFn: createJob,
  });

  async function onSubmit(values: CreateJobFormValues) {
    const initiatingToken = getSession()?.accessToken;
    setSubmissionError(null);
    try {
      await createMutation.mutateAsync(values);
      if (getSession()?.accessToken !== initiatingToken) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs(true) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs(false) }),
      ]);
      if (!isMounted.current || getSession()?.accessToken !== initiatingToken) {
        return;
      }
      toast.success('Lowongan berhasil dipublikasikan.');
      void navigate('/company/jobs');
    } catch (error) {
      if (!isMounted.current || getSession()?.accessToken !== initiatingToken) {
        return;
      }
      setSubmissionError(getErrorMessage(error));
      if (error instanceof ApiError && error.details) {
        for (const detail of error.details) {
          const field = detail.field;
          if (
            field === 'title' ||
            field === 'location' ||
            field === 'salary' ||
            field === 'jobType' ||
            field === 'description'
          ) {
            setError(field, { type: 'server', message: detail.message });
          }
        }
      }
    }
  }

  return (
    <div className="space-y-7">
      <Link
        to="/company/jobs"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke lowongan
      </Link>
      <header>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Bangun tim Anda
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Buat lowongan baru
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Ceritakan peran yang Anda cari. Informasi yang jelas membantu kandidat
          menemukan peluang yang sesuai.
        </p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Informasi lowongan</CardTitle>
            <CardDescription>
              Lengkapi seluruh kolom wajib sebelum memublikasikan lowongan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              noValidate
              onSubmit={(event) => {
                void handleSubmit(onSubmit)(event);
              }}
            >
              {submissionError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {submissionError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="job-title">Judul lowongan</Label>
                <Input
                  id="job-title"
                  placeholder="Contoh: Frontend Developer"
                  maxLength={200}
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? 'job-title-error' : undefined
                  }
                  disabled={createMutation.isPending}
                  {...register('title')}
                />
                {errors.title && (
                  <p
                    id="job-title-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-location">Lokasi kerja</Label>
                <Input
                  id="job-location"
                  placeholder="Contoh: Jakarta Selatan"
                  maxLength={200}
                  aria-required="true"
                  aria-invalid={Boolean(errors.location)}
                  aria-describedby={
                    errors.location ? 'job-location-error' : undefined
                  }
                  disabled={createMutation.isPending}
                  {...register('location')}
                />
                {errors.location && (
                  <p
                    id="job-location-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-salary">Gaji per bulan (IDR)</Label>
                  <Input
                    id="job-salary"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={2147483647}
                    step={1}
                    placeholder="Contoh: 8500000"
                    aria-required="true"
                    aria-invalid={Boolean(errors.salary)}
                    aria-describedby={
                      errors.salary ? 'job-salary-error' : 'job-salary-help'
                    }
                    disabled={createMutation.isPending}
                    {...register('salary', { valueAsNumber: true })}
                  />
                  <p
                    id="job-salary-help"
                    className="text-xs leading-5 text-muted-foreground"
                  >
                    Masukkan angka tanpa titik atau koma. Nilai 0 ditampilkan
                    sebagai Rp0.
                  </p>
                  {errors.salary && (
                    <p
                      id="job-salary-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.salary.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Jenis pekerjaan</Label>
                  <Controller
                    control={control}
                    name="jobType"
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={createMutation.isPending}
                      >
                        <SelectTrigger
                          id="job-type"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full"
                          aria-required="true"
                          aria-invalid={Boolean(errors.jobType)}
                          aria-describedby={
                            errors.jobType ? 'job-type-error' : undefined
                          }
                        >
                          <SelectValue placeholder="Pilih jenis pekerjaan" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map((jobType) => (
                            <SelectItem key={jobType} value={jobType}>
                              {JOB_TYPE_LABELS[jobType]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.jobType && (
                    <p
                      id="job-type-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.jobType.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description">
                  Deskripsi pekerjaan
                  <span className="font-normal text-muted-foreground">
                    (opsional)
                  </span>
                </Label>
                <Textarea
                  id="job-description"
                  rows={7}
                  maxLength={10000}
                  placeholder="Jelaskan tanggung jawab, kualifikasi, dan hal yang perlu diketahui kandidat."
                  className="min-h-44 resize-y"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? 'job-description-error'
                      : 'job-description-help'
                  }
                  disabled={createMutation.isPending}
                  {...register('description')}
                />
                <p
                  id="job-description-help"
                  className="text-xs text-muted-foreground"
                >
                  Maksimal 10.000 karakter. Teks ditampilkan sesuai baris yang
                  Anda tulis.
                </p>
                {errors.description && (
                  <p
                    id="job-description-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={createMutation.isPending}
                  onClick={() => void navigate('/company/jobs')}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="min-h-11"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight aria-hidden="true" />
                  )}
                  {createMutation.isPending
                    ? 'Memublikasikan…'
                    : 'Publikasikan lowongan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="rounded-xl border border-primary/10 bg-primary/5 p-5">
          <Info className="mb-3 size-5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">
            Bantu kandidat mengenal peran
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Gunakan judul yang spesifik, lokasi yang jelas, dan deskripsi yang
            mudah dipahami. Lowongan akan tampil untuk pencari kerja setelah
            dipublikasikan.
          </p>
        </aside>
      </div>
    </div>
  );
}
