import type { Invoice } from '@/lib/types';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export type InvoicePaymentSummary = {
  totalReceived: number;
  totalPending: number;
  totalInvoiced: number;
  invoiceCount: number;
  byStatus: { paid: number; partial: number; pending: number };
  monthly: Array<{
    month: string;
    label: string;
    received: number;
    pending: number;
  }>;
};

export function formatInrAmount(amount: number) {
  const value = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { prefix: 'Rs.', value };
}

/** Plain string for stat cards and labels */
export function formatInr(amount: number) {
  const { prefix, value } = formatInrAmount(amount);
  return `${prefix}\u00a0${value}`;
}

export function paymentStatusLabel(status: PaymentStatus) {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Pending';
}

export function paymentStatusClass(status: PaymentStatus) {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function getInvoicePending(invoice: Invoice) {
  return invoice.pendingAmount ?? Math.max(0, invoice.total - (invoice.paidAmount ?? 0));
}
