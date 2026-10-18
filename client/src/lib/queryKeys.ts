export const queryKeys = {
  profile: ['profile'] as const,
  resumes: ['resumes'] as const,
  candidate: (id: string) => ['candidate', id] as const,
  jobs: (mine = false) => ['jobs', { mine }] as const,
  job: (id: string) => ['job', id] as const,
  myApplications: ['my-applications'] as const,
  applicants: (jobId: string) => ['applicants', jobId] as const,
};
