export type Role = 'platform_admin' | 'superadmin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: string | { id: string; name: string; companyCode: string };
  isActive: boolean;
}

export interface SubCompany {
  id: string;
  company: string;
  name: string;
  address1: string;
  address2?: string;
  mobile: string;
  email: string;
  pan?: string;
  tan?: string;
  sacCode?: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountNumber?: string;
  accountNumberMasked?: string;
  authorizedSignatory?: string;
  isCharteredAccountant: boolean;
  isActive: boolean;
  hasLogo?: boolean;
  hasSignature?: boolean;
}

export interface Company {
  id: string;
  name: string;
  companyCode: string;
  isCharteredAccountant: boolean;
  address1: string;
  address2?: string;
  mobile: string;
  email: string;
  pan?: string;
  tan?: string;
  sacCode?: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountNumber?: string;
  accountNumberMasked?: string;
  authorizedSignatory?: string;
  isActive: boolean;
  superadmin?: { id: string; name: string; email: string } | null;
}

export interface Client {
  _id: string;
  company: string;
  clientId?: string;
  name: string;
  address1: string;
  address2?: string;
  gst?: string;
  pan?: string;
  tan?: string;
  mobile?: string;
  email?: string;
  state?: string;
  stateCode?: string;
  placeOfSupply?: string;
  isActive: boolean;
}

export interface Service {
  _id: string;
  company: string;
  name: string;
  description?: string;
  sacCode?: string;
  isActive: boolean;
}

export interface TaskRecurrenceRef {
  _id: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
}

export interface Task {
  _id: string;
  company: string;
  client: { _id: string; name: string } | string;
  service: { _id: string; name: string; sacCode?: string } | string;
  taskName: string;
  startDate: string;
  endDate: string;
  description?: string;
  amount: number;
  attachment?: string;
  status: 'todo' | 'inprogress' | 'completed';
  assignedTo?: string | { _id: string; name: string; email?: string; role?: string };
  taskType?: 'one_time' | 'recurring';
  recurrenceId?: string | TaskRecurrenceRef | null;
  isInvoiced?: boolean;
  isActive: boolean;
}

export interface PaymentMilestone {
  _id: string;
  label: string;
  amount: number;
  receivedDate: string;
  note?: string;
}

export interface Invoice {
  _id: string;
  company: string;
  subCompany?: string | { _id: string; name: string };
  client: { _id: string; name: string } | string;
  invoiceNumber: string;
  financialYear: string;
  sequence: number;
  invoiceDate: string;
  issuanceDate: string;
  lineItems: Array<{
    task: string | { _id: string; taskName: string };
    description: string;
    sacCode?: string;
    amount: number;
  }>;
  subtotal: number;
  total: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentMilestones?: PaymentMilestone[];
  paymentStatus?: 'pending' | 'partial' | 'paid';
  pdfPath?: string;
  createdAt: string;
}
