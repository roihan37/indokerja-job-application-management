import type { ApplicationStatus, JobType } from '@/types/api';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  Applied: 'Dilamar',
  Reviewing: 'Ditinjau',
  Shortlisted: 'Daftar pendek',
  Rejected: 'Ditolak',
  Accepted: 'Diterima',
};

const salaryFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatSalary(salary: number): string {
  return salaryFormatter.format(salary);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}
