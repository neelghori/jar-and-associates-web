'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { Logo } from '@/components/Logo';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { getHomePath, isEmployee } from '@/lib/roles';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const employeeView = isEmployee(user);

  return (
    <AuthGuard>
      <div className="flex min-h-screen dashboard-shell">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/95 px-6 py-4 backdrop-blur-sm lg:px-10">
            <Logo size="lg" href={getHomePath(user)} priority />
            <span className="hidden rounded-md border border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs font-bold text-brand-900 sm:inline">
              {employeeView ? 'My Tasks' : 'JAR Billing Suite'}
            </span>
          </header>
          <main className="flex-1 overflow-auto px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
