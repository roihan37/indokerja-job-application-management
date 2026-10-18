import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicantStatusControl } from '@/components/applications/ApplicantStatusControl';
import { queryKeys } from '@/lib/queryKeys';
import { clearSession, setSession } from '@/lib/session';
import { ApiError } from '@/services/api';
import { updateApplicationStatus } from '@/services/applications.service';
import { makeSession } from '@/test/fixtures';
import type { JobApplicant, UpdatedApplication } from '@/types/api';

vi.mock('@/services/applications.service', () => ({
  updateApplicationStatus: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const applicant: JobApplicant = {
  id: 'application-1',
  status: 'Applied',
  jobSeeker: { id: 'user-1', email: 'candidate@example.com' },
  createdAt: '2026-01-01T00:00:00Z',
};

function renderStatusControl() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKeys.applicants('job-1'), [applicant]);
  render(
    <QueryClientProvider client={queryClient}>
      <ApplicantStatusControl application={applicant} jobId="job-1" />
    </QueryClientProvider>,
  );
  return { queryClient, user: userEvent.setup() };
}

async function chooseStatus(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(
    screen.getByRole('combobox', {
      name: 'Status lamaran candidate@example.com',
    }),
  );
  await user.click(screen.getByRole('option', { name: label }));
  await user.click(
    screen.getByRole('button', {
      name: 'Simpan status lamaran candidate@example.com',
    }),
  );
}

describe('applicant status updates', () => {
  beforeEach(() => {
    vi.mocked(updateApplicationStatus).mockReset();
    setSession(makeSession({ role: 'COMPANY', userId: 'company-user-1' }));
  });

  afterEach(() => clearSession());

  it.each([
    { label: 'Diterima', status: 'Accepted' },
    { label: 'Ditolak', status: 'Rejected' },
  ] as const)(
    'requires confirmation before setting $status',
    async ({ label, status }) => {
      vi.mocked(updateApplicationStatus).mockResolvedValue({
        id: applicant.id,
        jobId: 'job-1',
        status,
        updatedAt: '2026-01-01T01:00:00Z',
      });
      const { queryClient, user } = renderStatusControl();

      await chooseStatus(user, label);

      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        `Ubah status menjadi ${label}?`,
      );
      expect(updateApplicationStatus).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole('button', { name: 'Ya, perbarui status' }),
      );

      await waitFor(() =>
        expect(updateApplicationStatus).toHaveBeenCalledWith(
          applicant.id,
          status,
        ),
      );
      await waitFor(() =>
        expect(
          queryClient.getQueryData<JobApplicant[]>(
            queryKeys.applicants('job-1'),
          )?.[0]?.status,
        ).toBe(status),
      );
    },
  );

  it('saves Reviewing directly and uses the status returned by the server', async () => {
    vi.mocked(updateApplicationStatus).mockResolvedValue({
      id: applicant.id,
      jobId: 'job-1',
      status: 'Shortlisted',
      updatedAt: '2026-01-01T01:00:00Z',
    });
    const { queryClient, user } = renderStatusControl();

    await chooseStatus(user, 'Ditinjau');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(updateApplicationStatus).toHaveBeenCalledWith(
      applicant.id,
      'Reviewing',
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryData<JobApplicant[]>(
          queryKeys.applicants('job-1'),
        )?.[0]?.status,
      ).toBe('Shortlisted'),
    );
  });

  it('keeps the saved status and shows an error if the API rejects an update', async () => {
    vi.mocked(updateApplicationStatus).mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', 'Ownership denied.'),
    );
    const { queryClient, user } = renderStatusControl();

    expect(
      screen.getByRole('button', {
        name: 'Simpan status lamaran candidate@example.com',
      }),
    ).toBeDisabled();
    await chooseStatus(user, 'Ditinjau');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Anda tidak memiliki izin',
    );
    expect(
      queryClient.getQueryData<JobApplicant[]>(
        queryKeys.applicants('job-1'),
      )?.[0]?.status,
    ).toBe('Applied');
  });

  it('does not update a replacement session cache when an old request completes', async () => {
    let finishUpdate: ((value: UpdatedApplication) => void) | undefined;
    vi.mocked(updateApplicationStatus).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpdate = resolve;
        }),
    );
    const { queryClient, user } = renderStatusControl();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await chooseStatus(user, 'Ditinjau');
    await waitFor(() => expect(updateApplicationStatus).toHaveBeenCalledOnce());

    queryClient.clear();
    setSession(makeSession({ role: 'COMPANY', userId: 'company-user-2' }));
    queryClient.setQueryData(queryKeys.applicants('job-1'), [
      { ...applicant, status: 'Accepted' },
    ]);
    await act(async () =>
      finishUpdate?.({
        id: applicant.id,
        jobId: 'job-1',
        status: 'Reviewing',
        updatedAt: '2026-01-01T01:00:00Z',
      }),
    );

    expect(
      queryClient.getQueryData<JobApplicant[]>(
        queryKeys.applicants('job-1'),
      )?.[0]?.status,
    ).toBe('Accepted');
    expect(invalidate).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
