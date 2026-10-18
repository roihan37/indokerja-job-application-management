import { api } from '@/services/api';
import type {
  CandidateDetail,
  CandidateProfile,
  MyProfile,
  ResumeAccess,
  ResumeMetadata,
} from '@/types/api';

export function getMyProfile(signal?: AbortSignal) {
  return api<MyProfile>('/profile/me', { signal });
}
export function updateMyProfile(
  body: Partial<Omit<CandidateProfile, 'createdAt' | 'updatedAt'>>,
) {
  return api<MyProfile>('/profile/me', { method: 'PATCH', body });
}
export function uploadResume(file: File) {
  const body = new FormData();
  body.append('file', file);
  return api<ResumeMetadata>('/profile/me/resume', { method: 'POST', body });
}
export function getMyResumes(signal?: AbortSignal) {
  return api<ResumeMetadata[]>('/profile/me/resumes', { signal });
}
export function getOwnResumeUrl(id: string, download = false) {
  return api<ResumeAccess>(
    `/profile/me/resumes/${encodeURIComponent(id)}/url?download=${download}`,
  );
}
export function getCandidate(id: string, signal?: AbortSignal) {
  return api<CandidateDetail>(
    `/applications/${encodeURIComponent(id)}/candidate`,
    { signal },
  );
}
export function getApplicationResumeUrl(id: string, download = false) {
  return api<ResumeAccess>(
    `/applications/${encodeURIComponent(id)}/resume-url?download=${download}`,
  );
}
