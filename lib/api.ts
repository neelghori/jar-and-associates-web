import type { PlatformBillingOverview } from '@/lib/platformBilling';
import { trackApiLoading } from '@/lib/api-loading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  errors?: unknown[];

  constructor(message: string, status: number, errors?: unknown[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser<T>() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  return trackApiLoading(executeRequest<T>(path, options, auth));
}

async function executeRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || 'Request failed', res.status, data.errors);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),

  forgotPassword: (email: string) =>
    request<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }, false),

  me: () => request<{ user: unknown }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getUsers: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ users: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/users${query}`
    );
  },
  getUnassignedUsers: () => request<{ users: unknown[] }>('/users?unassigned=true'),
  createUser: (body: unknown) =>
    request<{ user: unknown }>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: unknown) =>
    request<{ user: unknown }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  getPlatformBillingOverview: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<PlatformBillingOverview & { total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/platform/billing-overview${query}`
    );
  },

  getCompanies: () => request<{ companies: unknown[] }>('/companies'),
  getCompany: (id: string) => request<{ company: unknown }>(`/companies/${id}`),
  createCompany: (body: unknown) =>
    request<{ company: unknown; superadmin?: unknown }>('/companies', { method: 'POST', body: JSON.stringify(body) }),
  updateCompany: (id: string, body: unknown) =>
    request<{ company: unknown }>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  assignUserToCompany: (companyId: string, body: unknown) =>
    request<{ user: unknown }>(`/companies/${companyId}/assign-user`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getSubCompanies: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ subCompanies: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/sub-companies${query}`
    );
  },
  getSubCompany: (id: string) => request<{ subCompany: unknown }>(`/sub-companies/${id}`),
  createSubCompany: (body: unknown) =>
    request<{ subCompany: unknown }>('/sub-companies', { method: 'POST', body: JSON.stringify(body) }),
  updateSubCompany: (id: string, body: unknown) =>
    request<{ subCompany: unknown }>(`/sub-companies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSubCompany: (id: string) =>
    request<{ message: string }>(`/sub-companies/${id}`, { method: 'DELETE' }),
  uploadSubCompanyLogo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return request<{ subCompany: unknown }>(`/sub-companies/${id}/logo`, {
      method: 'PUT',
      body: formData,
    });
  },
  deleteSubCompanyLogo: (id: string) =>
    request<{ subCompany: unknown }>(`/sub-companies/${id}/logo`, { method: 'DELETE' }),
  uploadSubCompanySignature: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('signature', file);
    return request<{ subCompany: unknown }>(`/sub-companies/${id}/signature`, {
      method: 'PUT',
      body: formData,
    });
  },
  deleteSubCompanySignature: (id: string) =>
    request<{ subCompany: unknown }>(`/sub-companies/${id}/signature`, { method: 'DELETE' }),

  getClients: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ clients: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/clients${query}`
    );
  },
  createClient: (body: unknown) =>
    request<{ client: unknown }>('/clients', { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (id: string, body: unknown) =>
    request<{ client: unknown }>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClient: (id: string) =>
    request<{ message: string }>(`/clients/${id}`, { method: 'DELETE' }),

  getServices: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ services: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/services${query}`
    );
  },
  createService: (body: unknown) =>
    request<{ service: unknown }>('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: string, body: unknown) =>
    request<{ service: unknown }>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id: string) =>
    request<{ message: string }>(`/services/${id}`, { method: 'DELETE' }),

  getGroups: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ groups: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/groups${query}`
    );
  },
  createGroup: (body: unknown) =>
    request<{ group: unknown }>('/groups', { method: 'POST', body: JSON.stringify(body) }),
  updateGroup: (id: string, body: unknown) =>
    request<{ group: unknown }>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGroup: (id: string) =>
    request<{ message: string }>(`/groups/${id}`, { method: 'DELETE' }),

  getTasks: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ tasks: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/tasks${query}`
    );
  },
  createTask: (formData: FormData) =>
    request<{ task: unknown }>('/tasks', { method: 'POST', body: formData }),
  updateTask: (id: string, formData: FormData) =>
    request<{ task: unknown }>(`/tasks/${id}`, { method: 'PUT', body: formData }),
  updateTaskStatus: (id: string, status: string) =>
    request<{ task: unknown }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),

  getInvoices: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{ invoices: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/invoices${query}`
    );
  },
  getInvoicePaymentSummary: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<{
      totalReceived: number;
      totalPending: number;
      totalInvoiced: number;
      totalReimbursement: number;
      totalReimbursementPending: number;
      totalReimbursementReceived: number;
      invoiceCount: number;
      byStatus: { paid: number; partial: number; pending: number };
      monthly: Array<{
        month: string;
        label: string;
        received: number;
        pending: number;
        reimbursement: number;
        reimbursementPending: number;
      }>;
    }>(`/invoices/payment-summary${query}`);
  },
  recordInvoicePayment: (
    id: string,
    body: { amount?: number; paidAmount?: number; markFullyPaid?: boolean }
  ) =>
    request<{ invoice: unknown }>(`/invoices/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  addPaymentMilestone: (
    id: string,
    body: { label?: string; amount: number; receivedDate: string; note?: string }
  ) =>
    request<{ invoice: unknown }>(`/invoices/${id}/payment-milestones`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updatePaymentMilestone: (
    invoiceId: string,
    milestoneId: string,
    body: { label?: string; amount?: number; receivedDate?: string; note?: string }
  ) =>
    request<{ invoice: unknown }>(`/invoices/${invoiceId}/payment-milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deletePaymentMilestone: (invoiceId: string, milestoneId: string) =>
    request<{ invoice: unknown }>(`/invoices/${invoiceId}/payment-milestones/${milestoneId}`, {
      method: 'DELETE',
    }),
  createInvoice: (body: unknown) =>
    request<{ invoice: unknown }>('/invoices', { method: 'POST', body: JSON.stringify(body) }),
  getInvoice: (id: string) => request<{ invoice: unknown }>(`/invoices/${id}`),
  updateInvoice: (id: string, body: unknown) =>
    request<{ invoice: unknown }>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInvoice: (id: string) =>
    request<{ message: string }>(`/invoices/${id}`, { method: 'DELETE' }),

  taskAttachmentUrl: (id: string) => `${API_URL}/tasks/${id}/attachment`,
};

export function subCompanyLogoUrl(id: string) {
  return `${API_URL}/sub-companies/${id}/logo`;
}

export async function fetchSubCompanyLogoBlob(id: string) {
  return trackApiLoading(
    (async () => {
      const token = getToken();
      const res = await fetch(subCompanyLogoUrl(id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.blob();
    })()
  );
}

export function subCompanySignatureUrl(id: string) {
  return `${API_URL}/sub-companies/${id}/signature`;
}

export async function fetchSubCompanySignatureBlob(id: string) {
  return trackApiLoading(
    (async () => {
      const token = getToken();
      const res = await fetch(subCompanySignatureUrl(id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.blob();
    })()
  );
}

export async function openTaskAttachment(taskId: string) {
  return trackApiLoading(
    (async () => {
      const token = getToken();
      const res = await fetch(`${API_URL}/tasks/${taskId}/attachment`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError((data as { message?: string }).message || 'Failed to open attachment', res.status);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    })()
  );
}

export function downloadInvoice(id: string, filename: string) {
  const token = getToken();
  trackApiLoading(
    fetch(`${API_URL}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
  );
}
