import { BriefcaseBusiness, ClipboardList, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { UserMenu } from '@/components/layout/UserMenu';
import { Brand } from '@/components/shared/Brand';
import { cn } from '@/lib/utils';

export function SeekerLayout() {
  return (
    <div className="min-h-screen">
      <a href="#page-content" className="skip-link">
        Lewati ke konten
      </a>
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand to="/jobs" />
          <nav
            aria-label="Navigasi utama"
            className="hidden h-full gap-7 sm:flex"
          >
            {[
              { to: '/profile', label: 'Profil saya', icon: UserRound },
              { to: '/jobs', label: 'Cari lowongan', icon: BriefcaseBusiness },
              {
                to: '/applications',
                label: 'Lamaran saya',
                icon: ClipboardList,
              },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <UserMenu />
        </div>
        <nav
          aria-label="Navigasi mobile"
          className="flex border-t px-4 sm:hidden"
        >
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-sm font-medium',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground',
              )
            }
          >
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
            Cari lowongan
          </NavLink>
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-sm font-medium',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground',
              )
            }
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            Lamaran saya
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-sm font-medium',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground',
              )
            }
          >
            <UserRound className="size-4" aria-hidden="true" />
            Profil saya
          </NavLink>
        </nav>
      </header>
      <div id="page-content" tabIndex={-1}>
        <Outlet />
      </div>
      <footer className="mx-auto mt-8 flex max-w-[1440px] flex-col gap-2 border-t px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} IndoKerja</p>
        <p>Langkah baru untuk karier Anda.</p>
      </footer>
    </div>
  );
}
