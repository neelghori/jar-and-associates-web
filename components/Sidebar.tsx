'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings2,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyWorkspace, isPlatformAdmin } from '@/lib/roles';
import { Logo, LogoMark } from '@/components/Logo';

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (role: string) => boolean;
};

const links: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/companies',
    label: 'Companies',
    icon: Building2,
    show: (role) => role === 'platform_admin',
  },
  {
    href: '/companies',
    label: 'My Company',
    icon: Building2,
    show: (role) => role === 'superadmin',
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
    show: (role) => role === 'superadmin' || role === 'employee',
  },
  {
    href: '/services',
    label: 'Services',
    icon: Wrench,
    show: (role) => role === 'superadmin' || role === 'employee',
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: ClipboardList,
    show: (role) => role === 'superadmin' || role === 'employee',
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: FileText,
    show: (role) => role === 'superadmin' || role === 'employee',
  },
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    show: (role) => role === 'superadmin' || role === 'platform_admin',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || '';

  const visibleLinks = links.filter((link) => !link.show || link.show(role));

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-brand-800 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo size="md" onDark href="/dashboard" priority />
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
          {isPlatformAdmin(user) ? 'Platform Admin' : 'Billing Suite'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? 'sidebar-link-active'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-accent-400' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Link
            href="/account"
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/5 ${
              pathname === '/account' ? 'bg-white/10 text-white' : 'text-slate-200'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Change password
          </Link>
          <button
            onClick={logout}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 px-1 text-xs text-slate-500">
          <Settings2 className="h-3.5 w-3.5" />
          {hasCompanyWorkspace(user) ? 'Company workspace' : 'Platform workspace'}
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Logo size="sm" href="/dashboard" className="hidden sm:block" />
        <LogoMark className="sm:hidden" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Workspace</p>
          {title && <p className="mt-1 text-sm text-muted">{title}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Logo size="xs" className="opacity-90" />
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
          JAR Billing Suite
        </span>
      </div>
    </div>
  );
}
