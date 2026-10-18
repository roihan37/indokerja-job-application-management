import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { makeSession } from '@/test/fixtures';
import type { User, UserRole } from '@/types/api';

interface RouteCase {
  description: string;
  user: User | null;
  roles: UserRole[];
  expected: string;
}

const routeCases: RouteCase[] = [
  {
    description: 'redirects a logged-out user to login',
    user: null,
    roles: ['COMPANY'],
    expected: 'Login page',
  },
  {
    description: 'redirects a seeker away from company pages',
    user: makeSession().user,
    roles: ['COMPANY'],
    expected: 'Job listings',
  },
  {
    description: 'redirects a company away from seeker pages',
    user: makeSession({ role: 'COMPANY' }).user,
    roles: ['JOB_SEEKER'],
    expected: 'Company jobs',
  },
  {
    description: 'allows the authorized role to view its page',
    user: makeSession({ role: 'COMPANY' }).user,
    roles: ['COMPANY'],
    expected: 'Protected content',
  },
];

describe('protected routes', () => {
  it.each(routeCases)('$description', ({ expected, roles, user }) => {
    render(
      <AuthContext value={{ user, login: vi.fn(), logout: vi.fn() }}>
        <MemoryRouter initialEntries={['/private']}>
          <Routes>
            <Route element={<ProtectedRoute roles={roles} />}>
              <Route path="/private" element={<p>Protected content</p>} />
            </Route>
            <Route path="/login" element={<p>Login page</p>} />
            <Route path="/jobs" element={<p>Job listings</p>} />
            <Route path="/company/jobs" element={<p>Company jobs</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext>,
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
