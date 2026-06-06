'use client';

import { useEffect, useState } from 'react';
import { Building2, ClipboardList, FileText, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { InvoicePaymentSummary } from '@/lib/invoicePayment';
import { hasCompanyWorkspace, isPlatformAdmin } from '@/lib/roles';
import { PaymentCharts } from '@/components/PaymentCharts';
import { PlatformBillingDashboard } from '@/components/PlatformBillingDashboard';
import { Alert, PageHeader, StatCard } from '@/components/ui';
import type { Client, Company, Invoice, Task, User } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    tasks: 0,
    invoices: 0,
    users: 0,
    companies: 0,
    billingCompanies: 0,
  });
  const [paymentSummary, setPaymentSummary] = useState<InvoicePaymentSummary | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      setLoadError('');
      if (isPlatformAdmin(user)) {
        const [companiesRes, usersRes] = await Promise.all([
          api.getCompanies(),
          api.getUsers(),
        ]);
        setStats({
          companies: 1,
          billingCompanies: 0,
          users: (usersRes.users as User[]).length,
          clients: 0,
          tasks: 0,
          invoices: 0,
        });
        setPaymentSummary(null);
        return;
      }

      if (!hasCompanyWorkspace(user)) return;

      const [clientsRes, tasksRes, invoicesRes, summaryRes, subCompaniesRes] = await Promise.all([
        api.getClients(),
        api.getTasks(),
        api.getInvoices(),
        api.getInvoicePaymentSummary(),
        user?.role === 'superadmin'
          ? api.getSubCompanies()
          : Promise.resolve({ subCompanies: [] }),
      ]);

      let usersCount = 0;
      if (user?.role === 'superadmin') {
        const usersRes = await api.getUsers();
        usersCount = (usersRes.users as User[]).length;
      }

      setStats({
        clients: (clientsRes.clients as Client[]).length,
        tasks: (tasksRes.tasks as Task[]).length,
        invoices: (invoicesRes.invoices as Invoice[]).length,
        users: usersCount,
        companies: 0,
        billingCompanies: (subCompaniesRes.subCompanies as unknown[]).length,
      });
      setPaymentSummary(summaryRes);
    }

    load().catch((err) => {
      console.error(err);
      setLoadError('Failed to load dashboard data');
    });
  }, [user?.role, user?.company]);

  const platformCards = [
    { label: 'Organization', value: stats.companies, icon: Building2, href: '/companies' },
    { label: 'Users', value: stats.users, icon: Users, href: '/users' },
  ];

  const companyCards = [
    { label: 'Clients', value: stats.clients, icon: Users, href: '/clients' },
    { label: 'Tasks', value: stats.tasks, icon: ClipboardList, href: '/tasks' },
    { label: 'Invoices', value: stats.invoices, icon: FileText, href: '/invoices' },
    ...(user?.role === 'superadmin'
      ? [
          { label: 'Companies', value: stats.billingCompanies, icon: Building2, href: '/sub-companies' },
          { label: 'Users', value: stats.users, icon: Users, href: '/users' },
        ]
      : []),
  ];

  const cards = isPlatformAdmin(user) ? platformCards : companyCards;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          isPlatformAdmin(user)
            ? `Good to see you, ${user?.name}. Review pending collections and outstanding invoices for JAR and Associates.`
            : `Good to see you, ${user?.name}. Track clients, tasks, billing, and payment collection from one place.`
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            href={card.href}
          />
        ))}
      </div>

      {loadError && (
        <div className="mt-6">
          <Alert message={loadError} />
        </div>
      )}

      {isPlatformAdmin(user) && <PlatformBillingDashboard />}

      {paymentSummary && !isPlatformAdmin(user) && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-brand-800">Payment collection</h2>
          <PaymentCharts summary={paymentSummary} />
        </div>
      )}
    </div>
  );
}
