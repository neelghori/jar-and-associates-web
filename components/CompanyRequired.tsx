'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyWorkspace } from '@/lib/roles';
import { Alert, Button } from '@/components/ui';

export function CompanyRequired({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (hasCompanyWorkspace(user)) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-xl">
      <Alert message="This module is available inside the JAR and Associates workspace. Sign in as a company superadmin or employee, or set up the organization first." type="error" />
      {user?.role === 'platform_admin' && (
        <Link href="/companies" className="mt-4 inline-block">
          <Button>Go to Organization</Button>
        </Link>
      )}
    </div>
  );
}
