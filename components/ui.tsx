import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function PageHeader({
  title,
  subtitle,
  action,
  hideLogo = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  hideLogo?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${hideLogo ? '' : 'sm:gap-6'}`}>
        {!hideLogo && <Logo size="md" href="/dashboard" className="shrink-0" />}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-800">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bento-card rounded-[1.25rem] p-6 shadow-[0_12px_36px_rgba(15,42,32,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
}) {
  return (
    <div className="stat-card rounded-[1.25rem] border border-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums whitespace-nowrap text-brand-800 sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 p-3 text-brand-600 ring-1 ring-brand-200/60">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary:
      'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white hover:from-brand-800 hover:via-brand-700 hover:to-brand-600 shadow-lg shadow-brand-600/25 accent-glow',
    secondary:
      'border border-border bg-surface text-brand-800 hover:bg-brand-50 hover:border-brand-200 shadow-sm',
    danger: 'bg-danger text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
    ghost: 'text-brand-700 hover:bg-brand-50',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
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
      <span className="mb-2 block text-sm font-medium text-brand-800">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        <input
          className={`w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${Icon ? 'pl-10' : ''}`}
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
      <span className="mb-2 block text-sm font-medium text-brand-800">{label}</span>
      <textarea
        className="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
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
      <span className="mb-2 block text-sm font-medium text-brand-800">{label}</span>
      <select
        className="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
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
      : 'bg-brand-50 text-brand-700 border-brand-200';
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[1.25rem] border border-border shadow-[0_8px_24px_rgba(15,42,32,0.03)]">
      <table className="min-w-full text-sm">
        <thead className="table-head text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3.5 font-semibold text-brand-700">
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
  return <h2 className="font-display mb-4 text-lg font-bold text-brand-800">{children}</h2>;
}
