export const queryKeys = {
  jobs: (mine = false) => ['jobs', { mine }] as const,
  job: (id: string) => ['job', id] as const,
  myApplications: ['my-applications'] as const,
  applicants: (jobId: string) => ['applicants', jobId] as const,
};
