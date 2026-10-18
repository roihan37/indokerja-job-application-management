import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { ProfilePage } from '@/pages/seeker/ProfilePage';
import { ApiError } from '@/services/api';
import {
  getMyProfile,
  updateMyProfile,
  uploadResume,
} from '@/services/profile.service';

vi.mock('@/services/profile.service', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadResume: vi.fn(),
  getOwnResumeUrl: vi.fn(),
}));
const data = {
  profile: {
    fullName: 'Sari',
    phone: null,
    location: null,
    headline: null,
    summary: null,
    createdAt: '',
    updatedAt: '',
  },
  currentResume: null,
};
beforeEach(() => {
  vi.mocked(getMyProfile).mockReset().mockResolvedValue(data);
  vi.mocked(updateMyProfile).mockReset().mockResolvedValue(data);
  vi.mocked(uploadResume).mockReset();
});
function show() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <ProfilePage />
    </QueryClientProvider>,
  );
}
it('prefills and saves the profile', async () => {
  show();
  expect(await screen.findByLabelText('Nama lengkap')).toHaveValue('Sari');
  fireEvent.change(screen.getByLabelText('Nama lengkap'), {
    target: { value: 'Sari Baru' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
  await waitFor(() =>
    expect(updateMyProfile).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Sari Baru' }),
      expect.anything(),
    ),
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Profil berhasil disimpan.',
  );
});
it('rejects invalid files and reports upload API failures', async () => {
  vi.mocked(uploadResume).mockRejectedValue(
    new ApiError(503, 'STORAGE_ERROR', 'Unavailable'),
  );
  show();
  const input = await screen.findByLabelText('Unggah CV');
  fireEvent.change(input, {
    target: { files: [new File(['bad'], 'bad.txt', { type: 'text/plain' })] },
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(/PDF/);
  expect(uploadResume).not.toHaveBeenCalled();
  fireEvent.change(input, {
    target: {
      files: [new File(['%PDF-test'], 'cv.pdf', { type: 'application/pdf' })],
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Unggah CV' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/CV|penyimpanan/i);
});
