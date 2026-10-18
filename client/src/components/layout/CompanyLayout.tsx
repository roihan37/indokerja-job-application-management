import { BriefcaseBusiness, Building2, Menu, Plus } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';

import { UserMenu } from '@/components/layout/UserMenu';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function CompanyNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navigasi perusahaan" className="space-y-2">
      {[
        {
          to: '/company/jobs',
          label: 'Lowongan saya',
          icon: BriefcaseBusiness,
          end: true,
        },
        {
          to: '/company/jobs/new',
          label: 'Buat lowongan',
          icon: Plus,
          end: false,
        },
      ].map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/8 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function getPageLabel(pathname: string) {
  if (pathname.endsWith('/new')) {
    return 'Buat lowongan';
  }
  if (pathname.endsWith('/applicants')) {
    return 'Pelamar lowongan';
  }
  return 'Lowongan saya';
}

export function CompanyLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const pageLabel = getPageLabel(pathname);
  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#page-content" className="skip-link">
        Lewati ke konten
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card px-5 py-7 lg:flex">
        <div className="px-3">
          <Brand to="/company/jobs" />
        </div>
        <p className="mt-12 mb-4 px-4 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Ruang perusahaan
        </p>
        <CompanyNavigation />
        <div className="mt-auto rounded-xl border bg-background p-4">
          <Building2 className="mb-3 size-5 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Bangun tim terbaik Anda</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Kelola lowongan dan proses lamaran dalam satu tempat.
          </p>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-sm sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Buka navigasi"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Navigasi perusahaan</SheetTitle>
                <SheetDescription>
                  Kelola lowongan dan pelamar.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <CompanyNavigation onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <p className="truncate text-sm font-medium text-muted-foreground">
            Perusahaan<span className="mx-2 text-border">/</span>
            <span className="text-foreground">{pageLabel}</span>
          </p>
        </div>
        <UserMenu />
      </header>
      <main
        id="page-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9"
      >
        <Outlet />
      </main>
    </div>
  );
}
