'use client';

import { PageHeader } from '@/components/ui';
import { ProfileMenu } from '@/components/ProfileMenu';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Manage your organization settings, password, and account."
      />
      <div className="mb-6">
        <ProfileMenu variant="page" />
      </div>
      {children}
    </div>
  );
}
