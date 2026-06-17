'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings2,
  Users,
  Wrench,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  getHomePath,
  hasCompanyWorkspace,
  isEmployee,
  isPlatformAdmin,
} from '@/lib/roles';
import { Logo } from '@/components/Logo';
import { ProfileMenu } from '@/components/ProfileMenu';

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (role: string) => boolean;
};

const links: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: (role) => role !== 'employee' },
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
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
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
  const { user } = useAuth();
  const role = user?.role || '';
  const employeeView = isEmployee(user);

  const visibleLinks = links.filter((link) => !link.show || link.show(role));

  return (
    <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col border-r border-white/10 bg-brand-900 text-white">
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <Logo size="xl" onDark href={getHomePath(user)} priority />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-accent-500">
          {isPlatformAdmin(user) ? 'Platform Admin' : employeeView ? 'My Tasks' : 'Billing Suite'}
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <div className="space-y-1">
          {visibleLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'sidebar-link-active'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent-500' : ''}`} />
                {employeeView && href === '/tasks' ? 'My Tasks' : label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative z-20 shrink-0 border-t border-white/10 p-3">
        <ProfileMenu variant="sidebar" />
        <div className="mt-2 flex items-center gap-2 px-1 text-[11px] text-neutral-600">
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {employeeView
              ? 'Assigned tasks only'
              : hasCompanyWorkspace(user)
                ? 'Company workspace'
                : 'Platform workspace'}
          </span>
        </div>
      </div>
    </aside>
  );
}
