import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Menu akun"
          className="h-11 gap-2 px-2"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden max-w-44 truncate text-sm font-medium xl:inline">
            {user?.email}
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.role === 'COMPANY' ? 'Akun perusahaan' : 'Pencari kerja'}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.role === 'JOB_SEEKER' && (
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserRound aria-hidden="true" />
              Profil saya
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={logout}>
          <LogOut aria-hidden="true" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
