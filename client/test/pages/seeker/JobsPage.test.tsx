import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { JobsPage } from '@/pages/seeker/JobsPage';
import { getMyApplications } from '@/services/applications.service';
import { getJob, getJobs } from '@/services/jobs.service';
import type { JobDetail } from '@/types/api';

vi.mock('@/services/jobs.service', () => ({
  getJob: vi.fn(),
  getJobs: vi.fn(),
}));
vi.mock('@/services/applications.service', () => ({
  applyToJob: vi.fn(),
  getMyApplications: vi.fn(),
}));

const jobs: JobDetail[] = [
  {
    id: 'job-full-time',
    title: 'Frontend Developer',
    company: { id: 'company-1', name: 'Nusantara Digital' },
    location: 'Jakarta',
    salary: 9000000,
    jobType: 'FULL_TIME',
    description: 'Build accessible interfaces.',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'job-contract',
    title: 'Backend Developer',
    company: { id: 'company-2', name: 'Example Technology' },
    location: 'Jakarta',
    salary: 10000000,
    jobType: 'CONTRACT',
    description: 'Build reliable services.',
    createdAt: '2026-10-02T00:00:00.000Z',
  },
];

function CurrentSearch() {
  const location = useLocation();
  return <p data-testid="discovery-url">{location.search}</p>;
}

function renderJobs(search: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/jobs${search}`]}>
        <JobsPage />
        <CurrentSearch />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('job discovery filters', () => {
  beforeEach(() => {
    vi.mocked(getJobs).mockReset().mockResolvedValue(jobs);
    vi.mocked(getJob)
      .mockReset()
      .mockImplementation((id) => {
        const job = jobs.find((candidate) => candidate.id === id);
        return job
          ? Promise.resolve(job)
          : Promise.reject(new Error('Job not found.'));
      });
    vi.mocked(getMyApplications).mockReset().mockResolvedValue([]);
  });

  it('selects and clears a mobile filter through its checkbox and label', async () => {
    const user = userEvent.setup();
    renderJobs('?keyword=Developer&location=Jakarta&selected=job-full-time');
    await screen.findByText('2 lowongan ditemukan');
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    const dialog = within(screen.getByRole('dialog'));
    const contract = dialog.getByRole('checkbox', { name: /Kontrak/ });

    await user.click(contract);

    await waitFor(() => expect(contract).toBeChecked());
    expect(screen.getByTestId('discovery-url')).toHaveTextContent(
      '?keyword=Developer&location=Jakarta&type=CONTRACT',
    );
    await user.click(
      dialog.getByRole('button', { name: 'Tampilkan lowongan' }),
    );
    expect(await screen.findByText('1 lowongan ditemukan')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Backend Developer' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Frontend Developer' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter (1)' }));
    const reopenedDialog = within(screen.getByRole('dialog'));
    await user.click(reopenedDialog.getByText('Kontrak', { exact: true }));

    await waitFor(() =>
      expect(
        reopenedDialog.getByRole('checkbox', { name: /Kontrak/ }),
      ).not.toBeChecked(),
    );
    expect(screen.getByTestId('discovery-url')).toHaveTextContent(
      '?keyword=Developer&location=Jakarta',
    );
  });

  it('supports keyboard selection and resetting filters without clearing search', async () => {
    const user = userEvent.setup();
    renderJobs('?keyword=Developer');
    await screen.findByText('2 lowongan ditemukan');
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    const dialog = within(screen.getByRole('dialog'));
    const contract = dialog.getByRole('checkbox', { name: /Kontrak/ });
    contract.focus();

    await user.keyboard('[Space]');

    await waitFor(() => expect(contract).toBeChecked());
    expect(screen.getByTestId('discovery-url')).toHaveTextContent(
      '?keyword=Developer&type=CONTRACT',
    );
    await user.click(dialog.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(contract).not.toBeChecked());
    expect(screen.getByTestId('discovery-url')).toHaveTextContent(
      '?keyword=Developer',
    );
  });
});
