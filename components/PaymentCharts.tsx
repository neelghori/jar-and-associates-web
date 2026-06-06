'use client';

import type { InvoicePaymentSummary } from '@/lib/invoicePayment';
import { formatInr } from '@/lib/invoicePayment';
import { MoneyAmount } from '@/components/MoneyAmount';
import { Card } from '@/components/ui';

type PaymentChartsProps = {
  summary: InvoicePaymentSummary;
};

const CHART_HEIGHT = 160;

export function PaymentCharts({ summary }: PaymentChartsProps) {
  const total = Math.max(summary.totalInvoiced, 0);
  const receivedPct = total > 0 ? (summary.totalReceived / total) * 100 : 0;
  const pendingPct = total > 0 ? (summary.totalPending / total) * 100 : 0;

  const months =
    summary.monthly.length > 0
      ? summary.monthly.slice(-6)
      : [];

  const monthMax = Math.max(
    1,
    ...months.map((m) => m.received + m.pending)
  );

  return (
    <div className="mb-6 grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-brand-800">Payment overview</h3>
        <p className="mt-0.5 text-xs text-muted">Received vs pending across all invoices</p>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 sm:max-w-[55%]">
            <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-slate-100">
              {receivedPct > 0 && (
                <div
                  className="flex items-center justify-center bg-brand-600 text-[10px] font-semibold text-white transition-all"
                  style={{ width: `${Math.max(receivedPct, receivedPct > 0 ? 8 : 0)}%` }}
                  title={`Received ${formatInr(summary.totalReceived)}`}
                >
                  {receivedPct >= 12 ? `${Math.round(receivedPct)}%` : ''}
                </div>
              )}
              {pendingPct > 0 && (
                <div
                  className="flex items-center justify-center bg-amber-500 text-[10px] font-semibold text-white transition-all"
                  style={{ width: `${Math.max(pendingPct, pendingPct > 0 ? 8 : 0)}%` }}
                  title={`Pending ${formatInr(summary.totalPending)}`}
                >
                  {pendingPct >= 12 ? `${Math.round(pendingPct)}%` : ''}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" />
                Received
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                Pending
              </span>
            </div>
          </div>

          <div className="shrink-0 space-y-3 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs font-medium text-muted">Received</span>
              <MoneyAmount amount={summary.totalReceived} variant="received" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs font-medium text-muted">Pending</span>
              <MoneyAmount amount={summary.totalPending} variant="pending" />
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-border pt-3">
              <span className="text-xs font-semibold text-brand-800">Total invoiced</span>
              <MoneyAmount amount={summary.totalInvoiced} />
            </div>
            <p className="text-[11px] text-muted">
              {summary.byStatus.paid} paid · {summary.byStatus.partial} partial ·{' '}
              {summary.byStatus.pending} pending
            </p>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="text-sm font-semibold text-brand-800">Monthly trend</h3>
        <p className="mt-0.5 text-xs text-muted">By invoice date (last {months.length} month(s))</p>

        {months.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No invoice data to chart yet.</p>
        ) : (
          <>
            <div
              className="mt-6 flex items-end justify-center gap-4 px-2 sm:gap-8"
              style={{ minHeight: CHART_HEIGHT + 28 }}
            >
              {months.map((m) => {
                const monthTotal = m.received + m.pending;
                const recH = Math.max(monthTotal > 0 ? (m.received / monthMax) * CHART_HEIGHT : 0, m.received > 0 ? 6 : 0);
                const penH = Math.max(monthTotal > 0 ? (m.pending / monthMax) * CHART_HEIGHT : 0, m.pending > 0 ? 6 : 0);
                return (
                  <div
                    key={m.month}
                    className="flex min-w-[64px] max-w-[100px] flex-1 flex-col items-center"
                  >
                    <div
                      className="flex w-full max-w-[72px] items-end justify-center gap-1.5"
                      style={{ height: CHART_HEIGHT }}
                    >
                      <div className="flex w-6 flex-col items-center justify-end" title={`Received ${formatInr(m.received)}`}>
                        <div
                          className="w-full rounded-t-md bg-brand-600 transition-all"
                          style={{ height: recH }}
                        />
                      </div>
                      <div className="flex w-6 flex-col items-center justify-end" title={`Pending ${formatInr(m.pending)}`}>
                        <div
                          className="w-full rounded-t-md bg-amber-500 transition-all"
                          style={{ height: penH }}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] font-medium text-muted">{m.label}</p>
                    <p className="mt-0.5 text-center text-[10px] text-muted">
                      <MoneyAmount amount={monthTotal} className="text-[10px]" />
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center gap-6 border-t border-border pt-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-3 rounded-sm bg-brand-600" />
                Received
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-3 rounded-sm bg-amber-500" />
                Pending
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
