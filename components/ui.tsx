import Link from 'next/link';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-brand-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bento-card rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-3 font-display text-2xl tabular-nums whitespace-nowrap text-brand-900 sm:text-3xl">
          {value}
        </p>
      </div>
      <div className="rounded-lg bg-brand-900 p-3 text-accent-500">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  const className =
    'stat-card block rounded-xl border border-border p-5 transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2';

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`View ${label}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
}) {
  const styles = {
    primary: 'bg-brand-900 text-white hover:bg-brand-800 shadow-lg shadow-black/15',
    secondary: 'border border-border bg-surface text-brand-900 hover:bg-brand-50 shadow-sm',
    accent: 'bg-accent-500 text-brand-900 hover:bg-accent-400 font-bold accent-glow',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'text-brand-900 hover:bg-brand-100',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: LucideIcon }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-900">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        <input
          className={`w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 ${Icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
    </label>
  );
}

export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-900">{label}</span>
      <textarea
        className="w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
        rows={3}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-900">{label}</span>
      <select
        className="w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Alert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  const styles =
    type === 'error'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-accent-500/10 text-accent-600 border-accent-500/40';
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <table className="min-w-full text-sm">
        <thead className="table-head text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3.5 font-semibold text-brand-900">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display mb-4 text-lg text-brand-900">{children}</h2>;
}
