import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { ResumeActions } from '@/components/profile/ResumeActions';
import { ApiError } from '@/services/api';

afterEach(() => vi.restoreAllMocks());
it('requests a fresh URL for each view and download', async () => {
  const replace = vi.fn();
  vi.spyOn(window, 'open').mockReturnValue({
    opener: null,
    location: { replace },
    close: vi.fn(),
  } as unknown as Window);
  const requestUrl = vi.fn().mockResolvedValue({
    url: 'https://private.example/signed',
    expiresIn: 60,
  });
  render(<ResumeActions requestUrl={requestUrl} />);
  fireEvent.click(screen.getByRole('button', { name: 'Lihat CV' }));
  await waitFor(() => expect(replace).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Unduh CV' }));
  await waitFor(() => expect(requestUrl).toHaveBeenCalledTimes(2));
  expect(requestUrl).toHaveBeenNthCalledWith(1, false);
  expect(requestUrl).toHaveBeenNthCalledWith(2, true);
});
it('closes the tab and shows authorization failures', async () => {
  const close = vi.fn();
  vi.spyOn(window, 'open').mockReturnValue({
    opener: null,
    close,
  } as unknown as Window);
  render(
    <ResumeActions
      requestUrl={vi
        .fn()
        .mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'Denied'))}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lihat CV' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/izin/);
  expect(close).toHaveBeenCalledOnce();
});
