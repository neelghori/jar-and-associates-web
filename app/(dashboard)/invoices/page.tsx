'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FileText, IndianRupee, Plus } from 'lucide-react';
import { api, ApiError, downloadInvoice } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { MoneyAmount } from '@/components/MoneyAmount';
import { PaymentCharts } from '@/components/PaymentCharts';
import { RowActions } from '@/components/RowActions';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { filterBySearch } from '@/lib/filterList';
import {
  formatInr,
  getInvoicePending,
  paymentStatusClass,
  paymentStatusLabel,
  type InvoicePaymentSummary,
} from '@/lib/invoicePayment';
import { Alert, Button, Card, Input, PageHeader, Select, Table } from '@/components/ui';
import type { Client, Company, Invoice, Task } from '@/lib/types';

type LineAmounts = Record<string, string>;
type LineSacCodes = Record<string, string>;

type EditLine = {
  taskId: string;
  taskName: string;
  description: string;
  sacCode: string;
  amount: string;
};

function normalizeSacInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function isValidSac(value: string) {
  const v = value.trim();
  if (!v) return true;
  return /^\d{4,6}$/.test(v);
}

function taskIdFromLine(item: Invoice['lineItems'][number]) {
  return typeof item.task === 'object' ? item.task._id : item.task;
}

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [editInvoiceDate, setEditInvoiceDate] = useState('');
  const [editIssuanceDate, setEditIssuanceDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [clientId, setClientId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [lineAmounts, setLineAmounts] = useState<LineAmounts>({});
  const [lineSacCodes, setLineSacCodes] = useState<LineSacCodes>({});
  const [defaultSac, setDefaultSac] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<InvoicePaymentSummary | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  async function loadInvoices() {
    const [invRes, summaryRes] = await Promise.all([
      api.getInvoices(),
      api.getInvoicePaymentSummary(),
    ]);
    setInvoices(invRes.invoices as Invoice[]);
    setPaymentSummary(summaryRes);
  }

  useEffect(() => {
    api.getClients().then((res) => setClients(res.clients as Client[])).catch(console.error);
    api.getCompanies()
      .then((res) => {
        const list = res.companies as Company[];
        if (list[0]?.sacCode) setDefaultSac(list[0].sacCode);
      })
      .catch(console.error);
    loadInvoices().catch(console.error);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setTasks([]);
      setSelectedTasks([]);
      setLineAmounts({});
      setLineSacCodes({});
      return;
    }
    api.getTasks({ clientId, invoiceable: 'true' })
      .then((res) => setTasks(res.tasks as Task[]))
      .catch(console.error);
    setSelectedTasks([]);
    setLineAmounts({});
    setLineSacCodes({});
  }, [clientId]);

  const filteredInvoices = useMemo(
    () =>
      filterBySearch(invoices, search, (inv) => [
        inv.invoiceNumber,
        typeof inv.client === 'object' ? inv.client.name : '',
        inv.total,
        new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
      ]),
    [invoices, search]
  );

  const total = useMemo(
    () =>
      selectedTasks.reduce((sum, id) => {
        const amount = parseFloat(lineAmounts[id] || '0');
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [selectedTasks, lineAmounts]
  );

  const editTotal = useMemo(
    () =>
      editLines.reduce((sum, line) => {
        const amount = parseFloat(line.amount || '0');
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [editLines]
  );

  function toggleTask(id: string) {
    setSelectedTasks((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        setLineAmounts((amounts) => {
          const copy = { ...amounts };
          delete copy[id];
          return copy;
        });
        setLineSacCodes((codes) => {
          const copy = { ...codes };
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
        setLineSacCodes((codes) => ({
          ...codes,
          [id]: codes[id] ?? defaultSac,
        }));
      }
      return [...prev, id];
    });
  }

  function setAmount(taskId: string, value: string) {
    setLineAmounts((prev) => ({ ...prev, [taskId]: value }));
  }

  function setSacCode(taskId: string, value: string) {
    setLineSacCodes((prev) => ({ ...prev, [taskId]: normalizeSacInput(value) }));
  }

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
        inv.lineItems.map((li) => ({
          taskId: taskIdFromLine(li),
          taskName: typeof li.task === 'object' ? li.task.taskName : '',
          description: li.description,
          sacCode: li.sacCode ?? '',
          amount: String(li.amount),
        }))
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
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!clientId || selectedTasks.length === 0) {
      setError('Select a client and at least one completed task');
      return;
    }

    const lineItems = selectedTasks.map((taskId) => {
      const amount = parseFloat(lineAmounts[taskId] || '');
      const sacCode = lineSacCodes[taskId]?.trim() || undefined;
      return { taskId, amount, sacCode };
    });

    if (lineItems.some((item) => !Number.isFinite(item.amount) || item.amount < 0)) {
      setError('Enter a valid amount (₹) for each selected task');
      return;
    }
    if (selectedTasks.some((id) => !isValidSac(lineSacCodes[id] || ''))) {
      setError('SAC code must be 4–6 digits when provided');
      return;
    }

    setLoading(true);
    try {
      await api.createInvoice({
        clientId,
        lineItems,
        invoiceDate: invoiceDate || undefined,
      });
      setSuccess('Invoice generated successfully');
      setSelectedTasks([]);
      setLineAmounts({});
      setLineSacCodes({});
      setClientId('');
      setInvoiceDate('');
      setShowForm(false);
      await loadInvoices();
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

    const lineItems = editLines.map((line) => ({
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

    setLoading(true);
    try {
      await api.updateInvoice(editing._id, {
        invoiceDate: editInvoiceDate,
        issuanceDate: editIssuanceDate,
        lineItems,
      });
      setSuccess('Invoice updated and PDF regenerated');
      closeEdit();
      await loadInvoices();
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
      await loadInvoices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete invoice');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const editingClientName =
    editing && typeof editing.client === 'object' ? editing.client.name : '—';

  function openPayment(invoice: Invoice) {
    setPaymentTarget(invoice);
    setReceiveAmount(String(getInvoicePending(invoice) || ''));
    setError('');
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    setPaymentLoading(true);
    setError('');
    try {
      const pending = getInvoicePending(paymentTarget);
      const amount = parseFloat(receiveAmount || '0');
      if (!Number.isFinite(amount) || amount < 0) {
        setError('Enter a valid amount');
        setPaymentLoading(false);
        return;
      }
      if (amount > pending + 0.001) {
        setError(`Amount cannot exceed pending ${formatInr(pending)}`);
        setPaymentLoading(false);
        return;
      }
      await api.recordInvoicePayment(paymentTarget._id, { amount });
      setSuccess('Payment recorded successfully');
      setPaymentTarget(null);
      setReceiveAmount('');
      await loadInvoices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleMarkFullyPaid() {
    if (!paymentTarget) return;
    setPaymentLoading(true);
    setError('');
    try {
      await api.recordInvoicePayment(paymentTarget._id, { markFullyPaid: true });
      setSuccess('Invoice marked as fully paid');
      setPaymentTarget(null);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update payment');
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
            <Button onClick={() => { setShowForm(true); setError(''); }}>
              <Plus className="h-4 w-4" />
              Generate Invoice
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !showEdit && !deleteTarget && !paymentTarget && (
          <div className="mb-4"><Alert message={error} /></div>
        )}

        {paymentSummary && <PaymentCharts summary={paymentSummary} />}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by invoice number, client, or amount..."
            total={invoices.length}
            filtered={filteredInvoices.length}
          />

          <Table
            headers={[
              'Invoice No.',
              'Client',
              'Date',
              'Total',
              'Received',
              'Pending',
              'Status',
              'Actions',
            ]}
          >
            {filteredInvoices.length === 0 ? (
              <EmptyTableRow
                colSpan={8}
                message={search ? 'No invoices match your search.' : 'No invoices yet. Click Generate Invoice to create one.'}
              />
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{typeof invoice.client === 'object' ? invoice.client.name : '—'}</td>
                  <td className="px-4 py-3">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
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
                      {getInvoicePending(invoice) > 0 && (
                        <Button
                          variant="ghost"
                          className="h-8 w-full justify-start px-2 text-xs"
                          onClick={() => openPayment(invoice)}
                        >
                          <IndianRupee className="h-3.5 w-3.5" />
                          Record payment
                        </Button>
                      )}
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
        </Card>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Generate Invoice"
          description="Select completed tasks and enter SAC code and amount for each line (SAC defaults from company profile when set)."
          size="lg"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Invoice Date (optional)" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />

            {clientId && (
              <div>
                <p className="mb-2 text-sm font-medium text-brand-800">Completed tasks (not yet invoiced)</p>
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
                              label="SAC code"
                              value={lineSacCodes[task._id] ?? ''}
                              onChange={(e) => setSacCode(task._id, e.target.value)}
                              placeholder={defaultSac ? `e.g. ${defaultSac}` : 'e.g. 9982'}
                              maxLength={6}
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

            <div className="rounded-xl border border-border bg-brand-50 px-3 py-2 text-sm">
              Invoice total: <strong className="text-brand-800">₹ {total.toFixed(2)}</strong>
              <span className="mt-1 block text-xs text-muted">Next number is assigned automatically (e.g. INC001).</span>
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
              <div className="space-y-3">
                {editLines.map((line, index) => (
                  <div key={line.taskId} className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-sm font-medium text-brand-800">{line.taskName || `Task ${index + 1}`}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
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
          onClose={() => setPaymentTarget(null)}
          title="Record payment"
          description={
            paymentTarget
              ? `Invoice ${paymentTarget.invoiceNumber} — pending ${formatInr(getInvoicePending(paymentTarget))}`
              : ''
          }
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2 rounded-xl border border-border bg-brand-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Total</span>
                {paymentTarget && <MoneyAmount amount={paymentTarget.total} />}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Received</span>
                {paymentTarget && <MoneyAmount amount={paymentTarget.paidAmount ?? 0} variant="received" />}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Pending</span>
                {paymentTarget && <MoneyAmount amount={getInvoicePending(paymentTarget)} variant="pending" />}
              </div>
            </div>
            <Input
              label="Amount received now (₹)"
              type="number"
              min="0"
              step="0.01"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
              required
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setPaymentTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                disabled={paymentLoading || !paymentTarget}
                onClick={handleMarkFullyPaid}
              >
                Mark fully paid
              </Button>
              <Button type="submit" className="flex-1" disabled={paymentLoading}>
                {paymentLoading ? 'Saving...' : 'Record payment'}
              </Button>
            </div>
          </form>
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
