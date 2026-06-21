'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Check, FileText, IndianRupee, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, downloadInvoice } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { MoneyAmount } from '@/components/MoneyAmount';
import { PaymentCharts } from '@/components/PaymentCharts';
import { RowActions } from '@/components/RowActions';
import { Pagination } from '@/components/Pagination';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mapPaginatedList } from '@/lib/listApi';
import {
  formatInr,
  getInvoicePending,
  paymentStatusClass,
  paymentStatusLabel,
  type InvoicePaymentSummary,
} from '@/lib/invoicePayment';
import { Alert, Button, Card, Input, PageHeader, Select, Table } from '@/components/ui';
import { SearchableSelect } from '@/components/SearchableSelect';
import { clientSelectOptions } from '@/lib/clientDisplay';
import type { Client, Company, Invoice, PaymentMilestone, SubCompany, Task } from '@/lib/types';

type MilestoneForm = {
  label: string;
  amount: string;
  receivedDate: string;
  note: string;
};

function emptyMilestoneForm(index: number): MilestoneForm {
  return {
    label: `Milestone ${index}`,
    amount: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    note: '',
  };
}

type LineAmounts = Record<string, string>;
type LineOrders = Record<string, string>;

type EditLine = {
  taskId: string;
  taskName: string;
  description: string;
  sacCode: string;
  amount: string;
  order: string;
};

function normalizeSacInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function isValidSac(value: string) {
  const v = value.trim();
  if (!v) return true;
  return /^\d{4,6}$/.test(v);
}

function parseLineOrder(value: string, fallback: number) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sortTaskIdsByOrder(taskIds: string[], orders: LineOrders) {
  return [...taskIds].sort((a, b) => {
    const orderA = parseLineOrder(orders[a] ?? '', taskIds.indexOf(a) + 1);
    const orderB = parseLineOrder(orders[b] ?? '', taskIds.indexOf(b) + 1);
    if (orderA !== orderB) return orderA - orderB;
    return taskIds.indexOf(a) - taskIds.indexOf(b);
  });
}

function sortEditLinesByOrder(lines: EditLine[]) {
  return [...lines].sort(
    (a, b) =>
      parseLineOrder(a.order, 1) - parseLineOrder(b.order, 1) ||
      lines.indexOf(a) - lines.indexOf(b)
  );
}

function taskIdFromLine(item: Invoice['lineItems'][number]) {
  return typeof item.task === 'object' ? item.task._id : item.task;
}

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function formatMilestoneDate(value: string) {
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN');
  }
  return new Date(value).toLocaleDateString('en-IN');
}

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [subCompanies, setSubCompanies] = useState<SubCompany[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const invoiceExtraParams = useMemo((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (companyFilter) params.subCompanyId = companyFilter;
    if (dateFrom) params.fromDate = dateFrom;
    if (dateTo) params.toDate = dateTo;
    if (statusFilter) params.paymentStatus = statusFilter;
    return params;
  }, [companyFilter, dateFrom, dateTo, statusFilter]);
  const fetchInvoices = useCallback(
    async (params: Record<string, string>) =>
      mapPaginatedList<Invoice>('invoices', await api.getInvoices(params)),
    []
  );
  const {
    items: invoices,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    setLimit,
    loading: listLoading,
    reload: reloadInvoices,
  } = usePaginatedList({ fetchList: fetchInvoices, extraParams: invoiceExtraParams });
  const hasInvoiceFilters = Boolean(search.trim() || companyFilter || dateFrom || dateTo || statusFilter);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const summaryFilterParams = useMemo((): Record<string, string> => {
    const params: Record<string, string> = { ...invoiceExtraParams };
    if (debouncedSearch) params.search = debouncedSearch;
    return params;
  }, [invoiceExtraParams, debouncedSearch]);

  const summaryFilterKey = useMemo(
    () => JSON.stringify(summaryFilterParams),
    [summaryFilterParams]
  );

  function clearInvoiceFilters() {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setCompanyFilter('');
  }

  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [editInvoiceDate, setEditInvoiceDate] = useState('');
  const [editIssuanceDate, setEditIssuanceDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [clientId, setClientId] = useState('');
  const [subCompanyId, setSubCompanyId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [lineAmounts, setLineAmounts] = useState<LineAmounts>({});
  const [lineOrders, setLineOrders] = useState<LineOrders>({});
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [reimbursementDescription, setReimbursementDescription] = useState('');
  const [reimbursementAmount, setReimbursementAmount] = useState('');
  const [editReimbursementDescription, setEditReimbursementDescription] = useState('');
  const [editReimbursementAmount, setEditReimbursementAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<InvoicePaymentSummary | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>(emptyMilestoneForm(1));
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<'record' | 'history'>('record');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const loadPaymentSummary = useCallback(async (params: Record<string, string>) => {
    try {
      const summaryRes = await api.getInvoicePaymentSummary(
        Object.keys(params).length ? params : undefined
      );
      setPaymentSummary(summaryRes);
    } catch (err) {
      console.error(err);
    }
  }, []);

  async function refreshInvoiceData() {
    await Promise.all([reloadInvoices(), loadPaymentSummary(summaryFilterParams)]);
  }

  useEffect(() => {
    api.getClients().then((res) => setClients(res.clients as Client[])).catch(console.error);
    api.getSubCompanies()
      .then((res) => setSubCompanies(res.subCompanies as SubCompany[]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadPaymentSummary(summaryFilterParams).catch(console.error);
  }, [summaryFilterKey, loadPaymentSummary]);

  useEffect(() => {
    if (!clientId) {
      setTasks([]);
      setSelectedTasks([]);
      setLineAmounts({});
      setLineOrders({});
      return;
    }
    api
      .getTasks({ clientId, invoiceable: 'true' })
      .then((res) => {
        const available = (res.tasks as Task[]).filter((t) => !t.isInvoiced);
        setTasks(available);
      })
      .catch(console.error);
    setSelectedTasks([]);
    setLineAmounts({});
    setLineOrders({});
  }, [clientId]);

  const invoiceTotal = useMemo(() => {
    const tasksTotal = selectedTasks.reduce((sum, id) => {
      const amount = parseFloat(lineAmounts[id] || '0');
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    const reimbursement = parseFloat(reimbursementAmount || '0');
    return tasksTotal + (Number.isFinite(reimbursement) ? reimbursement : 0);
  }, [selectedTasks, lineAmounts, reimbursementAmount]);

  const reimbursementRequired = selectedTasks.length === 0;

  const clientOptions = useMemo(() => clientSelectOptions(clients), [clients]);

  const editTotal = useMemo(() => {
    const linesTotal = editLines.reduce((sum, line) => {
      const amount = parseFloat(line.amount || '0');
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    const reimbursement = parseFloat(editReimbursementAmount || '0');
    return linesTotal + (Number.isFinite(reimbursement) ? reimbursement : 0);
  }, [editLines, editReimbursementAmount]);

  function toggleTask(id: string) {
    setSelectedTasks((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        setLineAmounts((amounts) => {
          const copy = { ...amounts };
          delete copy[id];
          return copy;
        });
        setLineOrders((orders) => {
          const copy = { ...orders };
          delete copy[id];
          return copy;
        });
        return next;
      }
      const task = tasks.find((t) => t._id === id);
      if (task) {
        setLineAmounts((amounts) => ({
          ...amounts,
          [id]: amounts[id] ?? (task.amount > 0 ? String(task.amount) : ''),
        }));
        setLineOrders((orders) => {
          const maxOrder = Object.values(orders).reduce(
            (max, value) => Math.max(max, parseLineOrder(value, 0)),
            0
          );
          return { ...orders, [id]: String(maxOrder + 1) };
        });
      }
      return [...prev, id];
    });
  }

  function setAmount(taskId: string, value: string) {
    setLineAmounts((prev) => ({ ...prev, [taskId]: value }));
  }

  function setLineOrder(taskId: string, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    setLineOrders((prev) => ({ ...prev, [taskId]: digits }));
  }

  function setEditLineOrder(index: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    setEditLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, order: digits } : line))
    );
  }

  const invoiceOrderPreview = useMemo(
    () =>
      sortTaskIdsByOrder(selectedTasks, lineOrders)
        .map((id) => tasks.find((t) => t._id === id))
        .filter((task): task is Task => Boolean(task)),
    [selectedTasks, lineOrders, tasks]
  );

  async function openEdit(invoice: Invoice) {
    setError('');
    setLoading(true);
    try {
      const res = await api.getInvoice(invoice._id);
      const inv = res.invoice as Invoice;
      setEditing(inv);
      setEditInvoiceDate(toDateInput(inv.invoiceDate));
      setEditIssuanceDate(toDateInput(inv.issuanceDate));
      setEditLines(
        inv.lineItems.map((li, index) => ({
          taskId: taskIdFromLine(li),
          taskName: typeof li.task === 'object' ? li.task.taskName : '',
          description: li.description,
          sacCode: li.sacCode ?? '',
          amount: String(li.amount),
          order: String(index + 1),
        }))
      );
      setEditReimbursementDescription(inv.reimbursementDescription || '');
      setEditReimbursementAmount(
        inv.reimbursementAmount && inv.reimbursementAmount > 0 ? String(inv.reimbursementAmount) : ''
      );
      setShowEdit(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  function closeEdit() {
    setShowEdit(false);
    setEditing(null);
    setEditLines([]);
    setEditReimbursementDescription('');
    setEditReimbursementAmount('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!clientId) {
      setError('Select a client');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Enter an invoice number');
      return;
    }
    if (subCompanies.length > 0 && !subCompanyId) {
      setError('Select a company for this invoice');
      return;
    }

    const normalizedReimbursementDescription = reimbursementDescription.trim();
    const normalizedReimbursementAmount = parseFloat(reimbursementAmount || '0');
    const hasReimbursement =
      Number.isFinite(normalizedReimbursementAmount) &&
      normalizedReimbursementAmount > 0 &&
      Boolean(normalizedReimbursementDescription);

    if (selectedTasks.length === 0 && !hasReimbursement) {
      setError('Select at least one completed task or add a reimbursement fee');
      return;
    }
    if (selectedTasks.length === 0) {
      if (!normalizedReimbursementDescription) {
        setError('Reimbursement description is required when no tasks are selected');
        return;
      }
      if (!Number.isFinite(normalizedReimbursementAmount) || normalizedReimbursementAmount <= 0) {
        setError('Enter a valid reimbursement amount when no tasks are selected');
        return;
      }
    } else if (normalizedReimbursementAmount > 0 && !normalizedReimbursementDescription) {
      setError('Reimbursement description is required when amount is provided');
      return;
    } else if (normalizedReimbursementDescription && (!Number.isFinite(normalizedReimbursementAmount) || normalizedReimbursementAmount <= 0)) {
      setError('Enter a valid reimbursement amount');
      return;
    }

    let lineItems: Array<{ taskId: string; amount: number }> = [];
    if (selectedTasks.length > 0) {
      const orderedTaskIds = sortTaskIdsByOrder(selectedTasks, lineOrders);
      if (orderedTaskIds.some((id) => !lineOrders[id]?.trim())) {
        setError('Enter an order number (1, 2, 3…) for each selected task');
        return;
      }

      lineItems = orderedTaskIds.map((taskId) => {
        const amount = parseFloat(lineAmounts[taskId] || '');
        return { taskId, amount };
      });

      if (lineItems.some((item) => !Number.isFinite(item.amount) || item.amount < 0)) {
        setError('Enter a valid amount (₹) for each selected task');
        return;
      }
    }

    if (invoiceTotal <= 0) {
      setError('Invoice total must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      await api.createInvoice({
        clientId,
        subCompanyId: subCompanyId || undefined,
        invoiceNumber: invoiceNumber.trim(),
        lineItems,
        invoiceDate: invoiceDate || undefined,
        reimbursementDescription: hasReimbursement ? normalizedReimbursementDescription : undefined,
        reimbursementAmount: hasReimbursement ? normalizedReimbursementAmount : undefined,
      });
      setSuccess('Invoice generated successfully');
      setSelectedTasks([]);
      setLineAmounts({});
      setLineOrders({});
      setClientId('');
      setSubCompanyId('');
      setInvoiceDate('');
      setInvoiceNumber('');
      setReimbursementDescription('');
      setReimbursementAmount('');
      setShowForm(false);
      setTasks([]);
      setSelectedTasks([]);
      await refreshInvoiceData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    setSuccess('');

    const normalizedEditReimbursementDescription = editReimbursementDescription.trim();
    const normalizedEditReimbursementAmount = parseFloat(editReimbursementAmount || '0');
    const hasEditReimbursement =
      Number.isFinite(normalizedEditReimbursementAmount) &&
      normalizedEditReimbursementAmount > 0 &&
      Boolean(normalizedEditReimbursementDescription);

    if (editLines.length === 0 && !hasEditReimbursement) {
      setError('Invoice must include at least one task line or a reimbursement fee');
      return;
    }
    if (normalizedEditReimbursementAmount > 0 && !normalizedEditReimbursementDescription) {
      setError('Reimbursement description is required when amount is provided');
      return;
    }
    if (normalizedEditReimbursementDescription && (!Number.isFinite(normalizedEditReimbursementAmount) || normalizedEditReimbursementAmount <= 0)) {
      setError('Enter a valid reimbursement amount');
      return;
    }

    let lineItems: Array<{
      taskId: string;
      description: string;
      sacCode?: string;
      amount: number;
    }> = [];

    if (editLines.length > 0) {
      if (editLines.some((line) => !line.order.trim())) {
        setError('Enter an order number (1, 2, 3…) for each line item');
        return;
      }

      const sortedLines = sortEditLinesByOrder(editLines);
      lineItems = sortedLines.map((line) => ({
        taskId: line.taskId,
        description: line.description.trim(),
        sacCode: line.sacCode.trim() || undefined,
        amount: parseFloat(line.amount || ''),
      }));

      if (lineItems.some((item) => !item.description)) {
        setError('Each line item needs a description');
        return;
      }
      if (lineItems.some((item) => !Number.isFinite(item.amount) || item.amount < 0)) {
        setError('Enter a valid amount (₹) for each line item');
        return;
      }
      if (editLines.some((line) => !isValidSac(line.sacCode))) {
        setError('SAC code must be 4–6 digits when provided');
        return;
      }
    }

    if (editTotal <= 0) {
      setError('Invoice total must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      await api.updateInvoice(editing._id, {
        invoiceDate: editInvoiceDate,
        issuanceDate: editIssuanceDate,
        lineItems,
        reimbursementDescription: hasEditReimbursement ? normalizedEditReimbursementDescription : '',
        reimbursementAmount: hasEditReimbursement ? normalizedEditReimbursementAmount : 0,
      });
      setSuccess('Invoice updated and PDF regenerated');
      closeEdit();
      await refreshInvoiceData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteInvoice(deleteTarget._id);
      setSuccess('Invoice deleted successfully');
      setDeleteTarget(null);
      await refreshInvoiceData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete invoice');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const editingClientName =
    editing && typeof editing.client === 'object' ? editing.client.name : '—';

  function applyPaymentInvoice(invoice: Invoice) {
    setPaymentTarget(invoice);
    const milestones = invoice.paymentMilestones ?? [];
    setPaymentMilestones(milestones);
    setEditingMilestoneId(null);
    setMilestoneForm(emptyMilestoneForm(milestones.length + 1));
    setPaymentTab(milestones.length > 0 ? 'history' : 'record');
  }

  async function openPayment(invoice: Invoice) {
    setError('');
    setPaymentLoading(true);
    try {
      const res = await api.getInvoice(invoice._id);
      applyPaymentInvoice(res.invoice as Invoice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payment details');
    } finally {
      setPaymentLoading(false);
    }
  }

  function closePaymentModal() {
    setPaymentTarget(null);
    setPaymentMilestones([]);
    setEditingMilestoneId(null);
    setMilestoneForm(emptyMilestoneForm(1));
    setPaymentTab('record');
    setError('');
  }

  const paymentReceived = paymentMilestones.reduce((sum, m) => sum + m.amount, 0);
  const paymentPending = paymentTarget
    ? Math.max(0, paymentTarget.total - paymentReceived)
    : 0;
  const paymentProgress = paymentTarget?.total
    ? Math.min(100, (paymentReceived / paymentTarget.total) * 100)
    : 0;

  function startEditMilestone(milestone: PaymentMilestone) {
    setPaymentTab('record');
    setEditingMilestoneId(milestone._id);
    setMilestoneForm({
      label: milestone.label,
      amount: String(milestone.amount),
      receivedDate: toDateInput(milestone.receivedDate),
      note: milestone.note ?? '',
    });
    setError('');
  }

  function cancelMilestoneEdit() {
    setEditingMilestoneId(null);
    setMilestoneForm(emptyMilestoneForm(paymentMilestones.length + 1));
    setError('');
  }

  async function refreshPaymentState(invoiceId: string) {
    const fresh = await api.getInvoice(invoiceId);
    applyPaymentInvoice(fresh.invoice as Invoice);
    await refreshInvoiceData();
  }

  async function handleMilestoneSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;

    const amount = parseFloat(milestoneForm.amount || '');
    if (!milestoneForm.label.trim()) {
      setError('Enter a milestone label');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero');
      return;
    }
    if (!milestoneForm.receivedDate) {
      setError('Select a received date');
      return;
    }

    const payload = {
      label: milestoneForm.label.trim(),
      amount,
      receivedDate: milestoneForm.receivedDate,
      note: milestoneForm.note.trim() || undefined,
    };

    setPaymentLoading(true);
    setError('');
    try {
      if (editingMilestoneId) {
        await api.updatePaymentMilestone(paymentTarget._id, editingMilestoneId, payload);
      } else {
        await api.addPaymentMilestone(paymentTarget._id, payload);
      }
      setSuccess(editingMilestoneId ? 'Milestone updated' : 'Milestone recorded');
      setPaymentTab('history');
      await refreshPaymentState(paymentTarget._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save milestone');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    if (!paymentTarget) return;
    setPaymentLoading(true);
    setError('');
    try {
      await api.deletePaymentMilestone(paymentTarget._id, milestoneId);
      setSuccess('Milestone removed');
      if (editingMilestoneId === milestoneId) cancelMilestoneEdit();
      await refreshPaymentState(paymentTarget._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete milestone');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleMarkFullyPaid() {
    if (!paymentTarget || paymentPending <= 0) return;
    if (!milestoneForm.receivedDate) {
      setError('Select a received date');
      return;
    }

    setPaymentLoading(true);
    setError('');
    try {
      await api.addPaymentMilestone(paymentTarget._id, {
        label: milestoneForm.label.trim() || 'Full payment',
        amount: paymentPending,
        receivedDate: milestoneForm.receivedDate,
        note: milestoneForm.note.trim() || undefined,
      });
      setSuccess('Full payment recorded');
      setPaymentTab('history');
      await refreshPaymentState(paymentTarget._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark fully paid');
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Invoices"
          subtitle="Generate, edit, or delete invoices. Editing regenerates the PDF. Deleting frees tasks to invoice again."
          action={
            <Button onClick={() => {
              setShowForm(true);
              setError('');
              setReimbursementDescription('');
              setReimbursementAmount('');
            }}>
              <Plus className="h-4 w-4" />
              Generate Invoice
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !showEdit && !deleteTarget && !paymentTarget && (
          <div className="mb-4"><Alert message={error} /></div>
        )}

        {paymentSummary && (
          <PaymentCharts summary={paymentSummary} filtered={hasInvoiceFilters} />
        )}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by invoice number, client, or amount..."
            total={total}
            page={page}
            limit={limit}
            loading={listLoading}
            filters={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Invoice date from"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 sm:w-[148px]"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Invoice date to"
                  min={dateFrom || undefined}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 sm:w-[148px]"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by payment status"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 sm:w-36"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
                {subCompanies.length > 0 && (
                  <div className="relative w-full shrink-0 sm:w-56">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      aria-label="Filter by company"
                      className="h-10 w-full appearance-none rounded-lg border border-border bg-white py-2 pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    >
                      <option value="">All companies</option>
                      {subCompanies.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                      <option value="__none__">No company assigned</option>
                    </select>
                  </div>
                )}
                {hasInvoiceFilters && (
                  <Button type="button" variant="ghost" onClick={clearInvoiceFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            }
          />

          <Table
            headers={[
              'Invoice No.',
              'Company',
              'Client',
              'Date',
              'Total',
              'Received',
              'Pending',
              'Status',
              'Actions',
            ]}
          >
            {!listLoading && invoices.length === 0 ? (
              <EmptyTableRow
                colSpan={9}
                message={
                  hasInvoiceFilters
                    ? 'No invoices match your filters.'
                    : 'No invoices yet. Click Generate Invoice to create one.'
                }
              />
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    {typeof invoice.subCompany === 'object' ? invoice.subCompany.name : '—'}
                  </td>
                  <td className="px-4 py-3">{typeof invoice.client === 'object' ? invoice.client.name : '—'}</td>
                  <td className="px-4 py-3">{formatMilestoneDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={invoice.total} />
                  </td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={invoice.paidAmount ?? 0} variant="received" />
                  </td>
                  <td className="px-4 py-3">
                    <MoneyAmount amount={getInvoicePending(invoice)} variant="pending" />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        paymentStatusClass(invoice.paymentStatus || 'pending')
                      }`}
                    >
                      {paymentStatusLabel(invoice.paymentStatus || 'pending')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[200px] flex-col gap-1.5">
                      <Button
                        variant="ghost"
                        className="h-8 w-full justify-start px-2 text-xs"
                        onClick={() => openPayment(invoice)}
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                        {(invoice.paymentMilestones?.length ?? 0) > 0 || (invoice.paidAmount ?? 0) > 0
                          ? 'Payment milestones'
                          : 'Record payment'}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 w-full justify-start px-2 text-xs"
                        onClick={() => downloadInvoice(invoice._id, `${invoice.invoiceNumber}.pdf`)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Download PDF
                      </Button>
                      <div className="flex gap-1 border-t border-border pt-1.5">
                        <RowActions
                          onEdit={() => openEdit(invoice)}
                          onDelete={() => setDeleteTarget(invoice)}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            disabled={listLoading}
          />
        </Card>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Generate Invoice"
          description="Select the company, enter the invoice number, pick completed tasks (optional), and add reimbursement fee if needed."
          size="lg"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. 24-25/001"
              required
            />
            {subCompanies.length > 0 ? (
              <Select
                label="Company"
                value={subCompanyId}
                onChange={(e) => setSubCompanyId(e.target.value)}
                required
              >
                <option value="">Select company</option>
                {subCompanies.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No companies yet. Add them under Companies to bill under a specific firm.
              </div>
            )}
            <SearchableSelect
              label="Client"
              value={clientId}
              onChange={setClientId}
              options={clientOptions}
              required
              searchPlaceholder="Search by client ID (e.g. CLI001) or name..."
              placeholder="Select a client from the list"
              emptyMessage="No clients match your search"
            />
            <Input label="Invoice Date (optional)" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />

            {clientId && (
              <div>
                <p className="mb-2 text-sm font-medium text-brand-800">Completed tasks (optional)</p>
                <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-border p-3">
                  {tasks.length === 0 && (
                    <p className="text-sm text-muted">No completed tasks ready to invoice for this client.</p>
                  )}
                  {tasks.map((task) => {
                    const selected = selectedTasks.includes(task._id);
                    return (
                      <div
                        key={task._id}
                        className={`rounded-lg border p-3 ${selected ? 'border-brand-300 bg-brand-50/50' : 'border-border'}`}
                      >
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleTask(task._id)}
                            className="mt-1"
                          />
                          <span className="font-medium text-brand-800">{task.taskName}</span>
                        </label>
                        {selected && (
                          <div className="mt-3 grid gap-3 pl-6 sm:grid-cols-2">
                            <Input
                              label="Order on invoice"
                              type="number"
                              min="1"
                              step="1"
                              value={lineOrders[task._id] ?? ''}
                              onChange={(e) => setLineOrder(task._id, e.target.value)}
                              placeholder="1"
                              required
                            />
                            <Input
                              label="Amount (₹)"
                              type="number"
                              min="0"
                              step="0.01"
                              value={lineAmounts[task._id] ?? ''}
                              onChange={(e) => setAmount(task._id, e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-medium text-brand-800">
                Reimbursement fee{reimbursementRequired ? ' (required without tasks)' : ' (optional)'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Description"
                  value={reimbursementDescription}
                  onChange={(e) => setReimbursementDescription(e.target.value)}
                  placeholder="e.g. Travel reimbursement"
                  required={reimbursementRequired}
                />
                <Input
                  label="Amount (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={reimbursementAmount}
                  onChange={(e) => setReimbursementAmount(e.target.value)}
                  placeholder="0.00"
                  required={reimbursementRequired}
                />
              </div>
            </div>

            {selectedTasks.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-brand-800">Invoice line order preview</p>
                <p className="mb-3 text-xs text-muted">
                  Set order as 1, 2, 3… on each task above. The PDF uses this sequence for SN numbers.
                </p>
                <div className="space-y-2 rounded-xl border border-border p-3">
                  {invoiceOrderPreview.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                        {lineOrders[task._id] || '—'}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-brand-800">{task.taskName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-brand-50 px-3 py-2 text-sm">
              Invoice total: <strong className="text-brand-800">₹ {invoiceTotal.toFixed(2)}</strong>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={showEdit}
          onClose={closeEdit}
          title={`Edit ${editing?.invoiceNumber ?? 'invoice'}`}
          description="Update dates, SAC codes, line descriptions, or amounts. The PDF is regenerated; invoice number stays the same."
          size="lg"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Invoice number" value={editing?.invoiceNumber ?? ''} disabled />
              <Input label="Client" value={editingClientName} disabled />
              <Input
                label="Company"
                value={
                  editing && typeof editing.subCompany === 'object'
                    ? editing.subCompany.name
                    : '—'
                }
                disabled
              />
              <Input
                label="Invoice date"
                type="date"
                value={editInvoiceDate}
                onChange={(e) => setEditInvoiceDate(e.target.value)}
                required
              />
              <Input
                label="Date of issuance"
                type="date"
                value={editIssuanceDate}
                onChange={(e) => setEditIssuanceDate(e.target.value)}
                required
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-brand-800">Line items</p>
              <p className="mb-3 text-xs text-muted">
                Set order as 1, 2, 3… for each line. The PDF uses this sequence for SN numbers.
              </p>
              <div className="space-y-3">
                {editLines.length === 0 && (
                  <p className="text-sm text-muted">No task line items on this invoice.</p>
                )}
                {editLines.map((line, index) => (
                  <div key={line.taskId} className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-sm font-medium text-brand-800">
                      {line.taskName || `Task ${index + 1}`}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Order on invoice"
                        type="number"
                        min="1"
                        step="1"
                        value={line.order}
                        onChange={(e) => setEditLineOrder(index, e.target.value)}
                        placeholder="1"
                        required
                      />
                      <div className="sm:col-span-2">
                      <Input
                        label="Particulars (description on PDF)"
                        value={line.description}
                        onChange={(e) => {
                          const next = [...editLines];
                          next[index] = { ...line, description: e.target.value };
                          setEditLines(next);
                        }}
                        required
                      />
                      </div>
                      <Input
                        label="SAC code"
                        value={line.sacCode}
                        onChange={(e) => {
                          const next = [...editLines];
                          next[index] = { ...line, sacCode: normalizeSacInput(e.target.value) };
                          setEditLines(next);
                        }}
                        placeholder="e.g. 9982"
                        maxLength={6}
                      />
                      <Input
                        label="Amount (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amount}
                        onChange={(e) => {
                          const next = [...editLines];
                          next[index] = { ...line, amount: e.target.value };
                          setEditLines(next);
                        }}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-medium text-brand-800">Reimbursement fee (optional)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Description"
                  value={editReimbursementDescription}
                  onChange={(e) => setEditReimbursementDescription(e.target.value)}
                  placeholder="e.g. Travel reimbursement"
                />
                <Input
                  label="Amount (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editReimbursementAmount}
                  onChange={(e) => setEditReimbursementAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-brand-50 px-3 py-2 text-sm">
              Invoice total: <strong className="text-brand-800">₹ {editTotal.toFixed(2)}</strong>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading || !editing}>
                {loading ? 'Saving...' : 'Save & regenerate PDF'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={!!paymentTarget}
          onClose={closePaymentModal}
          title="Payment milestones"
          description={
            paymentTarget
              ? `Invoice ${paymentTarget.invoiceNumber} — mark each payment received as a milestone`
              : ''
          }
          size="lg"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-border bg-brand-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Invoice total</span>
                {paymentTarget && <MoneyAmount amount={paymentTarget.total} />}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Received</span>
                <MoneyAmount amount={paymentReceived} variant="received" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Pending</span>
                <MoneyAmount amount={paymentPending} variant="pending" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted">{paymentProgress.toFixed(0)}% collected</p>
            </div>

            <div className="flex gap-1 rounded-xl border border-border bg-brand-50/60 p-1">
              <button
                type="button"
                onClick={() => setPaymentTab('record')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  paymentTab === 'record'
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-muted hover:text-brand-800'
                }`}
              >
                Record payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('history')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  paymentTab === 'history'
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-muted hover:text-brand-800'
                }`}
              >
                Recorded
                {paymentMilestones.length > 0 && (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-semibold text-emerald-700">
                    {paymentMilestones.length}
                  </span>
                )}
              </button>
            </div>

            {paymentTab === 'history' && (
              <div>
                <p className="mb-3 text-sm font-medium text-brand-800">Recorded milestones</p>
                {paymentMilestones.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                    <p>No milestones recorded yet.</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-3"
                      onClick={() => setPaymentTab('record')}
                    >
                      Record first payment
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-80 space-y-0 overflow-y-auto pr-1">
                    {paymentMilestones.map((milestone, index) => (
                      <div key={milestone._id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-sm font-semibold text-emerald-700">
                            <Check className="h-4 w-4" />
                          </div>
                          {index < paymentMilestones.length - 1 && (
                            <div className="my-1 min-h-[24px] w-0.5 flex-1 bg-emerald-200" />
                          )}
                        </div>
                        <div className="mb-3 flex-1 rounded-xl border border-border bg-white p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-brand-800">
                                {index + 1}. {milestone.label}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {formatMilestoneDate(milestone.receivedDate)}
                                {milestone.note ? ` · ${milestone.note}` : ''}
                              </p>
                            </div>
                            <MoneyAmount amount={milestone.amount} variant="received" />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => startEditMilestone(milestone)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-danger"
                              onClick={() => handleDeleteMilestone(milestone._id)}
                              disabled={paymentLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={closePaymentModal}>
                    Close
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => setPaymentTab('record')}>
                    Record payment
                  </Button>
                </div>
              </div>
            )}

            {paymentTab === 'record' && (
            <form onSubmit={handleMilestoneSubmit} className="space-y-4 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-brand-800">
                {editingMilestoneId ? 'Edit milestone' : 'Add milestone'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Milestone label"
                  value={milestoneForm.label}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, label: e.target.value })}
                  placeholder="e.g. Advance, Part 1"
                  required
                />
                <Input
                  label="Amount received (₹)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={milestoneForm.amount}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                  required
                />
                <Input
                  label="Received date"
                  type="date"
                  value={milestoneForm.receivedDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, receivedDate: e.target.value })}
                  required
                />
                <Input
                  label="Note (optional)"
                  value={milestoneForm.note}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, note: e.target.value })}
                  placeholder="UPI, cheque, etc."
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" className="flex-1" onClick={closePaymentModal}>
                  Close
                </Button>
                {editingMilestoneId && (
                  <Button type="button" variant="ghost" className="flex-1" onClick={cancelMilestoneEdit}>
                    Cancel edit
                  </Button>
                )}
                {paymentPending > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    disabled={paymentLoading}
                    onClick={handleMarkFullyPaid}
                  >
                    Mark fully paid
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={paymentLoading}>
                  {paymentLoading
                    ? 'Saving...'
                    : editingMilestoneId
                      ? 'Update milestone'
                      : 'Add milestone'}
                </Button>
              </div>
            </form>
            )}
          </div>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete invoice?"
          message={
            deleteTarget
              ? `Delete invoice ${deleteTarget.invoiceNumber}? Linked tasks will be marked as not invoiced so you can bill them again.`
              : ''
          }
          confirmLabel="Delete invoice"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
