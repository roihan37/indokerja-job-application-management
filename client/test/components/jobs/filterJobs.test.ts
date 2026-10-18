import { describe, expect, it } from 'vitest';

import type { JobSummary } from '@/types/api';

import { filterJobs } from '@/components/jobs/filterJobs';

const jobs: JobSummary[] = [
  {
    id: 'job-1',
    title: 'Frontend Developer',
    company: { id: 'company-1', name: 'Nusantara Digital' },
    location: 'Jakarta Selatan',
    salary: 8500000,
    jobType: 'FULL_TIME',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'job-2',
    title: 'Backend Developer',
    company: { id: 'company-2', name: 'Example Technology' },
    location: 'Bandung',
    salary: 10000000,
    jobType: 'CONTRACT',
    createdAt: '2026-10-02T00:00:00.000Z',
  },
  {
    id: 'job-3',
    title: 'Frontend Intern',
    company: { id: 'company-2', name: 'Example Technology' },
    location: 'Jakarta Pusat',
    salary: 0,
    jobType: 'INTERNSHIP',
    createdAt: '2026-10-03T00:00:00.000Z',
  },
];

describe('filterJobs', () => {
  it('searches titles and company names without case sensitivity', () => {
    expect(filterJobs(jobs, 'FRONTEND', '', []).map((job) => job.id)).toEqual([
      'job-1',
      'job-3',
    ]);
    expect(filterJobs(jobs, 'nusantara', '', []).map((job) => job.id)).toEqual([
      'job-1',
    ]);
  });

  it('combines keyword, location, and any selected job types', () => {
    expect(
      filterJobs(jobs, 'frontend', 'JAKARTA', ['CONTRACT', 'INTERNSHIP']).map(
        (job) => job.id,
      ),
    ).toEqual(['job-3']);
    expect(filterJobs(jobs, 'frontend', 'Bandung', [])).toEqual([]);
  });

  it('keeps every job in API order when all filters are empty', () => {
    expect(filterJobs(jobs, '', '', [])).toEqual(jobs);
    expect(jobs.map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3']);
  });

  it('handles an empty API result', () => {
    expect(filterJobs([], 'developer', 'Jakarta', ['FULL_TIME'])).toEqual([]);
  });
});
