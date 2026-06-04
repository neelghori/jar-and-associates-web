'use client';

import { useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronRight, IndianRupee } from 'lucide-react';
import { MoneyAmount } from '@/components/MoneyAmount';
import {
  formatInr,
  paymentStatusClass,
  paymentStatusLabel,
} from '@/lib/invoicePayment';
import type { PlatformBillingOverview, PlatformCompanyBilling } from '@/lib/platformBilling';
import { filterBySearch } from '@/lib/filterList';
import { TableToolbar } from '@/components/TableToolbar';
import { Alert, Card, StatCard, Table } from '@/components/ui';

type Props = {
  overview: PlatformBillingOverview;
};

function clientName(client: PlatformCompanyBilling['invoices'][0]['client']) {
  return typeof client === 'object' ? client.name : '—';
}

function CompanySection({ company }: { company: PlatformCompanyBilling }) {
  const [open, setOpen] = useState(company.totalPending > 0);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-brand-50/60"
      >
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-brand-600" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-brand-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-800">{company.name}</p>
          <p className="text-xs text-muted">
            {company.companyCode} · {company.outstandingCount} outstanding
            {company.invoiceCount !== company.outstandingCount
              ? ` · ${company.invoiceCount} invoices total`
              : ''}
          </p>
        </div>
        <div className="grid shrink-0 gap-3 text-right sm:grid-cols-3 sm:gap-6">
          <div>
            <p className="text-xs text-muted">Pending</p>
            <MoneyAmount amount={company.totalPending} variant="pending" className="justify-end" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-muted">Received</p>
            <MoneyAmount amount={company.totalReceived} variant="received" className="justify-end" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-muted">Invoiced</p>
            <MoneyAmount amount={company.totalInvoiced} className="justify-end" />
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {company.invoices.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No outstanding invoices for this company.</p>
          ) : (
            <Table
              headers={['Invoice No.', 'Client', 'Date', 'Total', 'Received', 'Pending', 'Status']}
            >
              {company.invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{clientName(invoice.client)}</td>
                  <td className="px-4 py-3">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={invoice.total} />
                  </td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={invoice.paidAmount} variant="received" />
                  </td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={invoice.pendingAmount} variant="pending" />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        paymentStatusClass(invoice.paymentStatus)
                      }`}
                    >
                      {paymentStatusLabel(invoice.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </Card>
  );
}

export function PlatformBillingDashboard({ overview }: Props) {
  const [search, setSearch] = useState('');

  const filteredCompanies = useMemo(
    () =>
      filterBySearch(overview.companies, search, (c) => [
        c.name,
        c.companyCode,
        ...c.invoices.flatMap((inv) => [
          inv.invoiceNumber,
          clientName(inv.client),
        ]),
      ]),
    [overview.companies, search]
  );

  const { totals } = overview;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-800">Collections across companies</h2>
        <p className="mt-1 text-sm text-muted">
          Pending amounts and outstanding invoices for every active company on the platform.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total pending"
          value={formatInr(totals.totalPending)}
          icon={IndianRupee}
        />
        <StatCard
          label="Outstanding invoices"
          value={totals.outstandingInvoiceCount}
          icon={IndianRupee}
        />
        <StatCard label="Active companies" value={totals.companyCount} icon={Building2} />
        <StatCard
          label="Total invoiced"
          value={formatInr(totals.totalInvoiced)}
          icon={IndianRupee}
        />
      </div>

      <Card>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search company, invoice number, or client..."
          total={overview.companies.length}
          filtered={filteredCompanies.length}
        />
      </Card>

      {filteredCompanies.length === 0 ? (
        <Alert message="No companies match your search." />
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map((company) => (
            <CompanySection key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
