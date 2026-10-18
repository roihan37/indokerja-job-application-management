import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearSession, setSession } from '@/lib/session';
import { CreateJobPage } from '@/pages/company/CreateJobPage';
import { createJob } from '@/services/jobs.service';
import { makeSession } from '../../fixtures';
import type { CreatedJob } from '@/types/api';

vi.mock('@/services/jobs.service', () => ({ createJob: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const createdJob: CreatedJob = {
  id: 'job-1',
  companyId: 'company-1',
  title: 'Frontend Developer',
  location: 'Jakarta',
  salary: 8500000,
  jobType: 'FULL_TIME',
  description: '',
  createdAt: '2026-01-01T00:00:00Z',
};

function renderCreateJob() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/company/jobs/new']}>
        <Link to="/elsewhere">Halaman lain</Link>
        <Routes>
          <Route path="/company/jobs/new" element={<CreateJobPage />} />
          <Route
            path="/company/jobs"
            element={<h1>Daftar lowongan perusahaan</h1>}
          />
          <Route path="/elsewhere" element={<h1>Halaman lain</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { queryClient, user: userEvent.setup() };
}

async function submitJob(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Judul lowongan'), createdJob.title);
  await user.type(screen.getByLabelText('Lokasi kerja'), createdJob.location);
  await user.type(screen.getByLabelText('Gaji per bulan (IDR)'), '8500000');
  await user.click(
    screen.getByRole('button', { name: 'Publikasikan lowongan' }),
  );
  await waitFor(() => expect(createJob).toHaveBeenCalledOnce());
}

describe('create job completion', () => {
  beforeEach(() => {
    vi.mocked(createJob).mockReset();
    setSession(makeSession({ role: 'COMPANY', userId: 'company-user-1' }));
  });

  afterEach(() => clearSession());

  it('refreshes jobs and navigates after a successful active submission', async () => {
    vi.mocked(createJob).mockResolvedValue(createdJob);
    const { queryClient, user } = renderCreateJob();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await submitJob(user);

    expect(
      await screen.findByRole('heading', {
        name: 'Daftar lowongan perusahaan',
      }),
    ).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it.each(['page change', 'session change'] as const)(
    'ignores late success UI after a %s',
    async (change) => {
      let finishCreate: ((job: CreatedJob) => void) | undefined;
      vi.mocked(createJob).mockImplementation(
        () =>
          new Promise((resolve) => {
            finishCreate = resolve;
          }),
      );
      const { queryClient, user } = renderCreateJob();
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
      await submitJob(user);

      if (change === 'page change') {
        await user.click(screen.getByRole('link', { name: 'Halaman lain' }));
      } else {
        queryClient.clear();
        setSession(makeSession({ role: 'COMPANY', userId: 'company-user-2' }));
      }

      await act(async () => finishCreate?.(createdJob));

      expect(toast.success).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('heading', { name: 'Daftar lowongan perusahaan' }),
      ).not.toBeInTheDocument();
      if (change === 'page change') {
        expect(
          screen.getByRole('heading', { name: 'Halaman lain' }),
        ).toBeInTheDocument();
      } else {
        expect(invalidate).not.toHaveBeenCalled();
      }
    },
  );

  it('rechecks the session after waiting for cache refreshes', async () => {
    let finishRefresh: (() => void) | undefined;
    const refresh = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    vi.mocked(createJob).mockResolvedValue(createdJob);
    const { queryClient, user } = renderCreateJob();
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(refresh);
    await submitJob(user);
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));

    queryClient.clear();
    setSession(makeSession({ role: 'COMPANY', userId: 'company-user-2' }));
    await act(async () => finishRefresh?.());

    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Buat lowongan baru' }),
    ).toBeInTheDocument();
  });
});
