import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/api';

export function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'COMPANY' ? '/company/jobs' : '/jobs'}
        replace
      />
    );
  }
  return <Outlet />;
}
