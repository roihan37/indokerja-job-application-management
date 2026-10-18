import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/services/api';
import type { ResumeAccess } from '@/types/api';

interface ResumeActionsProps {
  requestUrl: (download: boolean) => Promise<ResumeAccess>;
}

export function ResumeActions({ requestUrl }: ResumeActionsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function openResume(download: boolean) {
    const tab = window.open('about:blank', '_blank');
    if (!tab) {
      setError('Izinkan tab baru di browser untuk membuka CV.');
      return;
    }
    tab.opener = null;
    setBusy(true);
    setError('');
    try {
      const { url } = await requestUrl(download);
      tab.location.replace(url);
    } catch (cause) {
      tab.close();
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void openResume(false)}
        >
          {busy ? 'Menyiapkan CV…' : 'Lihat CV'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void openResume(true)}
        >
          Unduh CV
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
