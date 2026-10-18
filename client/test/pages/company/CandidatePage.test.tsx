import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';

import { CandidatePage } from '@/pages/company/CandidatePage';
import { getCandidate } from '@/services/profile.service';

vi.mock('@/services/profile.service', () => ({
  getCandidate: vi.fn(),
  getApplicationResumeUrl: vi.fn(),
}));
it('renders a read-only candidate and the no-CV fallback', async () => {
  vi.mocked(getCandidate).mockResolvedValue({
    id: 'app-1',
    status: 'Applied',
    createdAt: '2026-10-18T00:00:00Z',
    job: { id: 'job-1', title: 'Engineer' },
    jobSeeker: { id: 'user-1', email: 'sari@example.com', profile: null },
    resume: null,
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/company/applications/app-1']}>
        <Routes>
          <Route
            path="/company/applications/:applicationId"
            element={<CandidatePage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(
    await screen.findByRole('heading', { name: 'sari@example.com' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Kandidat tidak melampirkan CV pada lamaran ini.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
