import type { JobSummary, JobType } from '@/types/api';

export const JOB_TYPES: JobType[] = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
];

export function filterJobs(
  jobs: JobSummary[],
  keyword: string,
  location: string,
  selectedTypes: JobType[],
) {
  const normalizedKeyword = keyword.toLocaleLowerCase('id-ID');
  const normalizedLocation = location.toLocaleLowerCase('id-ID');

  return jobs.filter((job) => {
    const matchesKeyword = `${job.title} ${job.company.name}`
      .toLocaleLowerCase('id-ID')
      .includes(normalizedKeyword);
    const matchesLocation = job.location
      .toLocaleLowerCase('id-ID')
      .includes(normalizedLocation);
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(job.jobType);

    return matchesKeyword && matchesLocation && matchesType;
  });
}
