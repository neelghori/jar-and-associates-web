'use client';

import { useAuth } from '@/lib/auth-context';
import { getHomePath, isEmployee, isEmployeeAllowedPath } from '@/lib/roles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && isEmployee(user) && !isEmployeeAllowedPath(pathname)) {
      router.replace(getHomePath(user));
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (isEmployee(user) && !isEmployeeAllowedPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
