'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { DEFAULT_COMPANY_NAME } from '@/lib/organization';
import { useAuth } from '@/lib/auth-context';
import { isEmployee, isPlatformAdmin } from '@/lib/roles';

export default function OrganizationProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const platformView = isPlatformAdmin(user);

  useEffect(() => {
    if (isEmployee(user)) {
      router.replace('/account/password');
    }
  }, [user, router]);

  if (isEmployee(user)) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-brand-900">
          {platformView ? 'Organization' : 'My Company'}
        </h2>
        <p className="text-sm text-muted">
          {platformView
            ? `Set up ${DEFAULT_COMPANY_NAME} as the single organization on this platform`
            : 'Update your organization profile'}
        </p>
      </div>
      <OrganizationSettings />
    </div>
  );
}
