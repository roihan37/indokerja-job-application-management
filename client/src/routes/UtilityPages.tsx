import { Navigate } from 'react-router';

import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'COMPANY') {
    return <Navigate to="/company/jobs" replace />;
  }
  return <Navigate to="/jobs" replace />;
}

export function RouteError() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <EmptyState
        title="Halaman belum dapat dibuka"
        description="Muat ulang halaman untuk mencoba kembali."
      >
        <Button onClick={() => window.location.reload()}>Muat ulang</Button>
      </EmptyState>
    </main>
  );
}
