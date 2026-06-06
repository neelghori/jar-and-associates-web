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
import {
  getHomePath,
  hasCompanyWorkspace,
  isEmployee,
  isPlatformAdmin,
} from '@/lib/roles';
import { Logo, LogoMark } from '@/components/Logo';

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (role: string) => boolean;
};

const links: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: (role) => role !== 'employee' },
  {
    href: '/companies',
    label: 'Organization',
    icon: Building2,
    show: (role) => role === 'platform_admin',
  },
  {
    href: '/companies',
    label: 'Organization',
    icon: Building2,
    show: (role) => role === 'superadmin',
  },
  {
    href: '/sub-companies',
    label: 'Companies',
    icon: Building2,
    show: (role) => role === 'superadmin',
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
    show: (role) => role === 'superadmin',
  },
  {
    href: '/services',
    label: 'Services',
    icon: Wrench,
    show: (role) => role === 'superadmin',
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
    show: (role) => role === 'superadmin',
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
  const employeeView = isEmployee(user);

  const visibleLinks = links.filter((link) => !link.show || link.show(role));

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-brand-900 text-white">
      <div className="border-b border-white/10 px-5 py-6">
        <Logo size="lg" onDark href={getHomePath(user)} priority />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-accent-500">
          {isPlatformAdmin(user) ? 'Platform Admin' : employeeView ? 'My Tasks' : 'Billing Suite'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition ${
                active
                  ? 'sidebar-link-active'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-accent-500' : ''}`} />
              {employeeView && href === '/tasks' ? 'My Tasks' : label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <LogoMark onDark />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs capitalize text-neutral-500">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Link
            href="/account"
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/5 ${
              pathname === '/account' ? 'bg-white/10 text-white' : 'text-neutral-300'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Change password
          </Link>
          <button
            onClick={logout}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 px-1 text-xs text-neutral-600">
          <Settings2 className="h-3.5 w-3.5" />
          {employeeView
            ? 'Assigned tasks only'
            : hasCompanyWorkspace(user)
              ? 'Company workspace'
              : 'Platform workspace'}
        </div>
      </div>
    </aside>
  );
}
