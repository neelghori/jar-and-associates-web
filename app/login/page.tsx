'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage clients, tasks, and invoices from one secure dashboard."
    >
      {error && <div className="mb-4"><Alert message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="link-secondary text-sm font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in to dashboard'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

    </AuthShell>
  );
}
