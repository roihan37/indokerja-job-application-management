import { api } from '@/services/api';
import type {
  ApplicationStatus,
  CreatedApplication,
  JobApplicant,
  MyApplication,
  UpdatedApplication,
} from '@/types/api';

export function applyToJob(jobId: string): Promise<CreatedApplication> {
  return api<CreatedApplication>(
    `/jobs/${encodeURIComponent(jobId)}/applications`,
    { method: 'POST' },
  );
}

export function getMyApplications(
  signal?: AbortSignal,
): Promise<MyApplication[]> {
  return api<MyApplication[]>('/applications/me', { signal });
}

export function getJobApplicants(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobApplicant[]> {
  return api<JobApplicant[]>(
    `/jobs/${encodeURIComponent(jobId)}/applications`,
    { signal },
  );
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<UpdatedApplication> {
  return api<UpdatedApplication>(
    `/applications/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: { status } },
  );
}
