'use client';

import Link from 'next/link';
import { FormEvent, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <Alert message="Invalid reset link. Request a new one." />;
  }

  return (
    <>
      {error && <div className="mb-4"><Alert message={error} /></div>}
      {message && <div className="mb-4"><Alert message={message} type="success" /></div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="New password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          label="Confirm password"
          type="password"
          icon={ShieldCheck}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Update password'}
        </Button>
      </form>

      {message && (
        <Link
          href="/login"
          className="link-secondary mt-6 inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to login
        </Link>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Create a new password"
      subtitle="Choose a strong password to secure your billing workspace."
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
