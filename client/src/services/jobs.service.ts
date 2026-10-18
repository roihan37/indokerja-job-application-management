import { api } from '@/services/api';
import type {
  CreateJobInput,
  CreatedJob,
  JobDetail,
  JobSummary,
} from '@/types/api';

export function getJobs(
  mine = false,
  signal?: AbortSignal,
): Promise<JobSummary[]> {
  return api<JobSummary[]>(mine ? '/jobs?mine=true' : '/jobs', { signal });
}

export function getJob(id: string, signal?: AbortSignal): Promise<JobDetail> {
  return api<JobDetail>(`/jobs/${encodeURIComponent(id)}`, { signal });
}

export function createJob(input: CreateJobInput): Promise<CreatedJob> {
  return api<CreatedJob>('/jobs', { method: 'POST', body: input });
}
