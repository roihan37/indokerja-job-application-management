export type UserRole = 'JOB_SEEKER' | 'COMPANY';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Session {
  accessToken: string;
  tokenType: 'Bearer';
  user: User;
}

export type LoginResponse = Session;

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export interface CompanySummary {
  id: string;
  name: string;
}

export interface JobSummary {
  id: string;
  title: string;
  company: CompanySummary;
  location: string;
  salary: number;
  jobType: JobType;
  createdAt: string;
}

export interface JobDetail extends JobSummary {
  description: string | null;
}

export interface CreateJobInput {
  title: string;
  location: string;
  salary: number;
  jobType: JobType;
  description?: string;
}

export interface CreatedJob extends Omit<CreateJobInput, 'description'> {
  id: string;
  companyId: string;
  description: string | null;
  createdAt: string;
}

export type ApplicationStatus =
  'Applied' | 'Reviewing' | 'Shortlisted' | 'Rejected' | 'Accepted';

export interface CreatedApplication {
  id: string;
  jobId: string;
  jobSeekerId: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  job: {
    id: string;
    title: string;
    company: CompanySummary;
    location: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicant {
  id: string;
  status: ApplicationStatus;
  jobSeeker: {
    id: string;
    email: string;
    profile?: { fullName: string | null; headline: string | null } | null;
  };
  createdAt: string;
}

export interface UpdatedApplication {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  updatedAt: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface CandidateProfile {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ResumeMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}
export interface MyProfile {
  profile: CandidateProfile | null;
  currentResume: ResumeMetadata | null;
}
export interface CandidateDetail extends Omit<JobApplicant, 'jobSeeker'> {
  job: { id: string; title: string };
  jobSeeker: { id: string; email: string; profile: CandidateProfile | null };
  resume: ResumeMetadata | null;
}
export interface ResumeAccess {
  url: string;
  expiresIn: number;
}
