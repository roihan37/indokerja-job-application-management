import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicantsPage } from '@/pages/company/ApplicantsPage';
import { ApiError } from '@/services/api';
import { getJobApplicants } from '@/services/applications.service';
import { getJob } from '@/services/jobs.service';

vi.mock('@/services/applications.service', () => ({
  getJobApplicants: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));
vi.mock('@/services/jobs.service', () => ({ getJob: vi.fn() }));

function renderApplicants() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/company/jobs/job-1/applicants']}>
        <Routes>
          <Route
            path="/company/jobs/:jobId/applicants"
            element={<ApplicantsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('company applicants page', () => {
  beforeEach(() => {
    vi.mocked(getJobApplicants).mockReset();
    vi.mocked(getJob).mockReset();
  });

  it('shows ownership rejection before requesting job details', async () => {
    vi.mocked(getJobApplicants).mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', 'Ownership denied.'),
    );

    renderApplicants();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Anda tidak memiliki izin',
    );
    expect(getJob).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Belum ada lamaran masuk'),
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when an authorized job has no applicants', async () => {
    vi.mocked(getJobApplicants).mockResolvedValue([]);
    vi.mocked(getJob).mockResolvedValue({
      id: 'job-1',
      title: 'Frontend Developer',
      company: { id: 'company-1', name: 'Example Technology' },
      location: 'Jakarta',
      salary: 0,
      jobType: 'FULL_TIME',
      description: null,
      createdAt: '2026-01-01T00:00:00Z',
    });

    renderApplicants();

    expect(
      await screen.findByText('Belum ada lamaran masuk'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('0 pelamar')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
