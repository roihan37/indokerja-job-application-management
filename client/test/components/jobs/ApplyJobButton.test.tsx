import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplyJobButton } from '@/components/jobs/ApplyJobButton';
import { ApiError } from '@/services/api';
import { applyToJob, getMyApplications } from '@/services/applications.service';
import { getMyResumes } from '@/services/profile.service';
import type { CreatedApplication } from '@/types/api';

vi.mock('@/services/applications.service', () => ({
  applyToJob: vi.fn(),
  getMyApplications: vi.fn(),
}));
vi.mock('@/services/profile.service', () => ({ getMyResumes: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

function renderApply() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ApplyJobButton jobId="job-1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('apply action', () => {
  beforeEach(() => {
    vi.mocked(applyToJob).mockReset();
    vi.mocked(getMyResumes).mockReset().mockResolvedValue([]);
    vi.mocked(getMyApplications).mockReset().mockResolvedValue([]);
  });

  it('prevents duplicate clicks while an application is being sent', async () => {
    let finishApplication:
      ((application: CreatedApplication) => void) | undefined;
    vi.mocked(applyToJob).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishApplication = resolve;
        }),
    );
    renderApply();
    const applyButton = await screen.findByRole('button', {
      name: 'Lamar sekarang',
    });
    await waitFor(() => expect(applyButton).toBeEnabled());

    fireEvent.click(applyButton);
    expect(applyToJob).not.toHaveBeenCalled();
    const confirm = await screen.findByRole('button', {
      name: 'Ya, kirim lamaran',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() => expect(confirm).toBeDisabled());
    fireEvent.click(confirm);

    expect(applyToJob).toHaveBeenCalledOnce();
    expect(applyToJob).toHaveBeenCalledWith('job-1', undefined);
    finishApplication?.({
      id: 'application-1',
      jobId: 'job-1',
      jobSeekerId: 'user-1',
      status: 'Applied',
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Lamaran sudah terkirim',
    );
  });

  it('handles a racing 409 as already applied and prevents another submission', async () => {
    vi.mocked(applyToJob).mockRejectedValue(
      new ApiError(409, 'ALREADY_APPLIED', 'Already applied.'),
    );
    renderApply();
    const applyButton = await screen.findByRole('button', {
      name: 'Lamar sekarang',
    });
    await waitFor(() => expect(applyButton).toBeEnabled());

    fireEvent.click(applyButton);
    const confirm = await screen.findByRole('button', {
      name: 'Ya, kirim lamaran',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Lamaran sudah terkirim',
    );
    expect(
      screen.queryByRole('button', { name: 'Lamar sekarang' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Pantau di Lamaran saya' }),
    ).toHaveAttribute('href', '/applications');
    expect(applyToJob).toHaveBeenCalledOnce();
    await waitFor(() => expect(getMyApplications).toHaveBeenCalledTimes(2));
  });

  it('attaches the latest uploaded resume by default after confirmation', async () => {
    vi.mocked(getMyResumes).mockResolvedValue([
      {
        id: 'resume-new',
        fileName: 'latest.pdf',
        mimeType: 'application/pdf',
        fileSize: 100,
        createdAt: '2026-10-18T02:00:00Z',
      },
      {
        id: 'resume-old',
        fileName: 'old.pdf',
        mimeType: 'application/pdf',
        fileSize: 100,
        createdAt: '2026-10-17T02:00:00Z',
      },
    ]);
    vi.mocked(applyToJob).mockResolvedValue({
      id: 'app-new',
      jobId: 'job-1',
      jobSeekerId: 'user-1',
      status: 'Applied',
      createdAt: '2026-10-18T03:00:00Z',
    });
    renderApply();
    const apply = await screen.findByRole('button', { name: 'Lamar sekarang' });
    await waitFor(() => expect(apply).toBeEnabled());
    fireEvent.click(apply);
    expect(await screen.findByText('latest.pdf (terbaru)')).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Ya, kirim lamaran' });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(applyToJob).toHaveBeenCalledWith('job-1', 'resume-new'),
    );
  });

  it('disables applying when existing applications cannot be checked', async () => {
    vi.mocked(getMyApplications).mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'Connection failed.'),
    );
    renderApply();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Status lamaran belum dapat dimuat.',
    );
    expect(
      screen.getByRole('button', { name: 'Lamar sekarang' }),
    ).toBeDisabled();
    expect(applyToJob).not.toHaveBeenCalled();
  });
});
