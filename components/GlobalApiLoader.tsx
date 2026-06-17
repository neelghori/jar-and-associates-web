'use client';

import { useEffect, useState } from 'react';
import { subscribeApiLoading } from '@/lib/api-loading';

export function GlobalApiLoader() {
  const [pending, setPending] = useState(0);

  useEffect(() => subscribeApiLoading(setPending), []);

  if (pending === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-900/25 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white px-8 py-7 shadow-2xl">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-brand-100 border-t-brand-900" />
        <p className="text-sm font-semibold text-brand-900">Please wait...</p>
      </div>
    </div>
  );
}
