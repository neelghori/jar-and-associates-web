'use client';

import { UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';

function userInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-brand-900">Profile</h2>
        <p className="text-sm text-muted">Your account details for this workspace.</p>
      </div>

      <Card className="max-w-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-brand-700 text-lg font-semibold text-white">
            {userInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-brand-900">{user?.name}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Role</dt>
            <dd className="mt-1 text-sm font-medium capitalize text-brand-900">
              {user?.role?.replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Status</dt>
            <dd className="mt-1 text-sm font-medium text-brand-900">
              {user?.isActive ? 'Active' : 'Inactive'}
            </dd>
          </div>
          {typeof user?.company === 'object' && user.company && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Organization</dt>
              <dd className="mt-1 text-sm font-medium text-brand-900">
                {user.company.companyCode} — {user.company.name}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <UserCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Use the menu above to change your password or manage organization settings.</p>
        </div>
      </Card>
    </div>
  );
}
