import { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import {
  BadgeIndianRupee,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';

const highlights = [
  { icon: Users, title: 'Client Management', text: 'Organize clients, GST, and contact details in one place.' },
  { icon: ClipboardList, title: 'Task Tracking', text: 'Assign services, track progress, and never miss deadlines.' },
  { icon: FileText, title: 'Smart Invoicing', text: 'Generate professional invoices from completed tasks instantly.' },
  { icon: ShieldCheck, title: 'Secure Billing', text: 'Encrypted bank details and role-based access controls.' },
];

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
};

export function AuthShell({ children, title, subtitle, badge = 'CA Billing Platform' }: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="auth-grid relative hidden overflow-hidden px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-accent-500/10 blur-2xl" />
        <div className="absolute bottom-10 right-8 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />

        <div className="relative z-10">
          <Logo size="lg" onDark priority />
          <div className="mt-10 inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
            <Building2 className="h-4 w-4 text-accent-400" />
            {badge}
          </div>
          <h1 className="font-display mt-8 max-w-lg text-4xl font-bold leading-tight">
            Manage billing, clients, and tasks with clarity.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            A modern workspace for chartered accountants — less manual work, faster invoicing.
          </p>
        </div>

        <div className="relative z-10 grid gap-4 sm:grid-cols-2">
          {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
            <div key={itemTitle} className="glass-card rounded-[1.25rem] p-4 transition hover:bg-white/10">
              <div className="mb-3 inline-flex rounded-2xl bg-accent-500/15 p-2.5 ring-1 ring-accent-400/25">
                <Icon className="h-5 w-5 text-accent-400" />
              </div>
              <h2 className="text-sm font-semibold">{itemTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-300">
          <BadgeIndianRupee className="h-4 w-4 text-accent-400" />
          Trusted billing workflow for chartered accountant firms
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(154,205,50,0.08),_transparent_40%)]" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="xl" priority className="mb-5" />
            <h2 className="font-display text-3xl font-bold text-brand-800">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_24px_64px_rgba(15,42,32,0.08)] sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center">
            <Logo size="xs" className="mx-auto opacity-80" />
          </p>
        </div>
      </section>
    </div>
  );
}
