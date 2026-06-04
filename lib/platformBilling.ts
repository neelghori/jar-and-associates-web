import type { PaymentStatus } from '@/lib/invoicePayment';

export type PlatformInvoiceRow = {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  client: { _id: string; name: string } | string;
};

export type PlatformCompanyBilling = {
  id: string;
  name: string;
  companyCode: string;
  totalPending: number;
  totalReceived: number;
  totalInvoiced: number;
  invoiceCount: number;
  outstandingCount: number;
  invoices: PlatformInvoiceRow[];
};

export type PlatformBillingOverview = {
  totals: {
    totalPending: number;
    totalReceived: number;
    totalInvoiced: number;
    companyCount: number;
    invoiceCount: number;
    outstandingInvoiceCount: number;
  };
  companies: PlatformCompanyBilling[];
};
