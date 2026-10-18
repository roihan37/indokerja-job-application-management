import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';

import { ApplicantStatusControl } from '@/components/applications/ApplicantStatusControl';
import { ResumeActions } from '@/components/profile/ResumeActions';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import {
  getApplicationResumeUrl,
  getCandidate,
} from '@/services/profile.service';

export function CandidatePage() {
  const { applicationId = '' } = useParams<{ applicationId: string }>();
  const candidate = useQuery({
    queryKey: queryKeys.candidate(applicationId),
    queryFn: ({ signal }) => getCandidate(applicationId, signal),
    enabled: Boolean(applicationId),
  });
  if (candidate.isPending) {
    return <PageSkeleton />;
  }
  if (candidate.isError) {
    return (
      <ErrorState
        error={candidate.error}
        onRetry={() => void candidate.refetch()}
      />
    );
  }
  const application = candidate.data;
  const { profile } = application.jobSeeker;
  return (
    <main className="space-y-6">
      <Link
        to={`/company/jobs/${application.job.id}/applicants`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
      >
        ← Kembali ke pelamar
      </Link>
      <header>
        <p className="text-sm text-muted-foreground wrap-anywhere">
          {application.job.title}
        </p>
        <h1 className="mt-2 text-2xl font-semibold wrap-anywhere">
          {profile?.fullName || application.jobSeeker.email}
        </h1>
        <p className="mt-2 wrap-anywhere">
          {profile?.headline || 'Headline belum diisi'}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil kandidat</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {[
                ['Email', application.jobSeeker.email],
                ['Telepon', profile?.phone],
                ['Lokasi', profile?.location],
                ['Ringkasan profesional', profile?.summary],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap wrap-anywhere">
                    {value || 'Belum diisi'}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lamaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Melamar {formatDate(application.createdAt)}
              </p>
              <StatusBadge status={application.status} />
              <ApplicantStatusControl
                application={application}
                jobId={application.job.id}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>CV terlampir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.resume ? (
                <>
                  <p className="font-medium wrap-anywhere">
                    {application.resume.fileName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(application.resume.fileSize / 1024).toFixed(1)} KB ·{' '}
                    {formatDate(application.resume.createdAt)}
                  </p>
                  <ResumeActions
                    requestUrl={(download) =>
                      getApplicationResumeUrl(application.id, download)
                    }
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kandidat tidak melampirkan CV pada lamaran ini.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
