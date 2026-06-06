'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevUrl('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.devResetUrl) setDevUrl(res.devResetUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email linked to your account and we will send you a secure reset link."
    >
      {error && <div className="mb-4"><Alert message={error} /></div>}
      {message && <div className="mb-4"><Alert message={message} type="success" /></div>}
      {devUrl && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs break-all text-amber-800">
          Dev reset link: <a href={devUrl} className="font-medium underline">{devUrl}</a>
        </div>
      )}

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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
          {!loading && <Send className="h-4 w-4" />}
        </Button>
      </form>

      <Link
        href="/login"
        className="link-secondary mt-6 inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </AuthShell>
  );
}
