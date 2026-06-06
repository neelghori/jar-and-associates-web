import { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import {
  BadgeIndianRupee,
  ClipboardList,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';

const highlights = [
  { icon: Users, title: 'Client Management', text: 'Organize clients, GST, and contact details in one place.' },
  { icon: ClipboardList, title: 'Task Tracking', text: 'Assign services, track progress, and never miss deadlines.' },
  { icon: FileText, title: 'Smart Invoicing', text: 'Generate professional invoices from completed tasks.' },
  { icon: ShieldCheck, title: 'Secure Billing', text: 'Encrypted bank details and role-based access controls.' },
];

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden lg:grid lg:grid-cols-2">
      <section className="auth-grid relative hidden h-full overflow-hidden lg:flex lg:items-center lg:justify-center">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-accent-500/12 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-72 w-72 rounded-full bg-accent-500/8 blur-3xl" />

        <div className="relative z-10 flex w-full max-w-xl flex-col gap-8 px-10 py-8 text-white xl:max-w-2xl xl:gap-10 xl:px-14">
          <div>
            <Logo size="xl" onDark priority />
            <h1 className="font-display mt-8 text-3xl leading-tight xl:text-4xl">
              Manage billing, clients, and tasks with clarity.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-neutral-400 xl:text-lg">
              A modern workspace for chartered accountants — less manual work, faster invoicing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
              <div key={itemTitle} className="glass-card rounded-xl p-4 xl:p-5">
                <div className="mb-3 inline-flex rounded-lg bg-accent-500/15 p-2.5 ring-1 ring-accent-500/30">
                  <Icon className="h-5 w-5 text-accent-500" />
                </div>
                <h2 className="text-sm font-semibold xl:text-base">{itemTitle}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400 xl:text-sm">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 text-sm text-neutral-500">
            <BadgeIndianRupee className="h-4 w-4 text-accent-500" />
            Trusted billing workflow for chartered accountant firms
          </div>
        </div>
      </section>

      <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-background px-6 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(88,185,71,0.08),_transparent_45%)]" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex w-full flex-col items-center text-center">
            <Logo size="xl" priority centered className="mb-5" />
            <h2 className="font-display text-3xl text-brand-900">{title}</h2>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-muted">{subtitle}</p>
          </div>

          <div className="auth-form-card rounded-2xl border border-border bg-surface p-7 shadow-[0_20px_50px_rgba(10,10,10,0.1)] sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
