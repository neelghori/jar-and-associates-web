'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ChevronsUpDown, KeyRound, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { canManageCompanies, isCompanySuperadmin } from '@/lib/roles';

type ProfileMenuProps = {
  variant?: 'sidebar' | 'page';
  onNavigate?: () => void;
};

function canManageOrganization(user: ReturnType<typeof useAuth>['user']) {
  return canManageCompanies(user) || isCompanySuperadmin(user);
}

function userInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfileAvatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-brand-700 font-semibold text-white ${sizeClass}`}
    >
      {userInitials(name)}
    </div>
  );
}

export function ProfileMenu({ variant = 'page', onNavigate }: ProfileMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    {
      href: '/account',
      label: 'Profile',
      icon: UserCircle,
      show: true,
    },
    {
      href: '/account/password',
      label: 'Change password',
      icon: KeyRound,
      show: true,
    },
    {
      href: '/account/organization',
      label: 'Organization',
      icon: Building2,
      show: canManageOrganization(user),
    },
  ].filter((link) => link.show);

  if (variant === 'sidebar') {
    return <SidebarProfileDropdown links={links} onNavigate={onNavigate} />;
  }

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
      active
        ? 'border-brand-900 bg-brand-900 text-white'
        : 'border-border bg-white text-brand-800 hover:bg-brand-50'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold text-brand-800">
        <UserCircle className="h-4 w-4" />
        Profile
      </span>
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/account'
            ? pathname === '/account'
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass(active)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Log out
      </button>
    </div>
  );
}

type SidebarProfileDropdownProps = {
  links: Array<{
    href: string;
    label: string;
    icon: typeof UserCircle;
    show: boolean;
  }>;
  onNavigate?: () => void;
};

function SidebarProfileDropdown({ links, onNavigate }: SidebarProfileDropdownProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const profileActive = pathname === '/account' || pathname.startsWith('/account/');

  function isActive(href: string) {
    if (href === '/account') return pathname === '/account';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeAndNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-border bg-white text-brand-900 shadow-xl ring-1 ring-black/5">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <ProfileAvatar name={user?.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-900">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="p-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeAndNavigate}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
                  isActive(href)
                    ? 'bg-brand-50 font-medium text-brand-900'
                    : 'text-brand-800 hover:bg-brand-50/80'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-600" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                closeAndNavigate();
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-brand-800 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
          profileActive || open
            ? 'bg-white/10 ring-1 ring-white/20'
            : 'hover:bg-white/5 ring-1 ring-transparent hover:ring-white/10'
        }`}
      >
        <ProfileAvatar name={user?.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-neutral-400">{user?.email}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-500" />
      </button>
    </div>
  );
}
