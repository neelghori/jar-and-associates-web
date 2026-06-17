'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { exportClientsToExcel } from '@/lib/exportClientsExcel';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { Pagination } from '@/components/Pagination';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mapPaginatedList } from '@/lib/listApi';
import {
  normalizeTaxPayload,
  TAX_ID_HINTS,
  TAX_ID_MAX_LENGTH,
  validateOptionalTaxIds,
} from '@/lib/indianTaxIds';
import { Alert, Button, Card, Input, PageHeader, Table, Textarea } from '@/components/ui';
import type { Client } from '@/lib/types';

const emptyForm = {
  name: '', address1: '', address2: '', gst: '', pan: '', tan: '',
  mobile: '', email: '', state: '', stateCode: '', placeOfSupply: '', reference: '',
};

function clientToForm(client: Client) {
  return {
    name: client.name,
    address1: client.address1 || '',
    address2: client.address2 || '',
    gst: client.gst || '',
    pan: client.pan || '',
    tan: client.tan || '',
    mobile: client.mobile || '',
    email: client.email || '',
    state: client.state || '',
    stateCode: client.stateCode || '',
    placeOfSupply: client.placeOfSupply || '',
    reference: client.reference || '',
  };
}

export default function ClientsPage() {
  const fetchClients = useCallback(
    async (params: Record<string, string>) => mapPaginatedList<Client>('clients', await api.getClients(params)),
    []
  );
  const {
    items: clients,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    loading: listLoading,
    reload,
  } = usePaginatedList({ fetchList: fetchClients });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedIds.size;
  const pageAllSelected = clients.length > 0 && clients.every((client) => selectedIds.has(client._id));
  const pageSomeSelected = clients.some((client) => selectedIds.has(client._id)) && !pageAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = pageSomeSelected;
    }
  }, [pageSomeSelected, clients]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm(clientToForm(client));
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const taxError = validateOptionalTaxIds(form);
    if (taxError) {
      setError(taxError);
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email or leave it blank');
      return;
    }
    setSuccess('');
    setLoading(true);
    try {
      const payload = normalizeTaxPayload(form);
      if (editing) {
        await api.updateClient(editing._id, payload);
        setSuccess('Client updated successfully');
      } else {
        await api.createClient(payload);
        setSuccess('Client created successfully');
      }
      closeForm();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save client');
    } finally {
      setLoading(false);
    }
  }

  function toggleClientSelection(clientId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function togglePageSelection() {
    const pageIds = clients.map((client) => client._id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function fetchAllClients() {
    const res = await api.getClients();
    return (res.clients as Client[]) ?? [];
  }

  async function handleExportAllExcel() {
    setError('');
    setSuccess('');
    setExporting(true);
    try {
      const allClients = await fetchAllClients();
      if (allClients.length === 0) {
        setError('No clients available to export');
        return;
      }
      exportClientsToExcel(allClients);
      setSuccess(`Exported all ${allClients.length} client${allClients.length === 1 ? '' : 's'} to Excel`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to export clients');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSelectedExcel() {
    if (selectedCount === 0) {
      setError('Select at least one client to export, or use Export All');
      return;
    }

    setError('');
    setSuccess('');
    setExporting(true);
    try {
      const allClients = await fetchAllClients();
      const toExport = allClients.filter((client) => selectedIds.has(client._id));
      if (toExport.length === 0) {
        setError('Selected clients could not be found');
        return;
      }
      exportClientsToExcel(toExport);
      setSuccess(`Exported ${toExport.length} selected client${toExport.length === 1 ? '' : 's'} to Excel`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to export clients');
    } finally {
      setExporting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteClient(deleteTarget._id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      setSuccess('Client deleted successfully');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete client');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Clients"
          subtitle="Export all clients or selected ones to Excel. Browse, edit, or remove clients from the list."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleExportAllExcel}
                disabled={exporting || listLoading || total === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export All'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportSelectedExcel}
                disabled={exporting || listLoading || selectedCount === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by client ID, name, reference, email, mobile, GST, PAN..."
            total={total}
            page={page}
            limit={limit}
            loading={listLoading}
            action={
              selectedCount > 0 ? (
                <Button type="button" variant="ghost" onClick={clearSelection}>
                  Clear selection ({selectedCount})
                </Button>
              ) : undefined
            }
          />

          <Table
            headers={[
              <input
                key="select-all"
                ref={selectAllRef}
                type="checkbox"
                checked={pageAllSelected}
                onChange={togglePageSelection}
                disabled={listLoading || clients.length === 0}
                aria-label="Select all clients on this page"
                className="h-4 w-4 rounded border-border accent-brand-900"
              />,
              'Client ID',
              'Name',
              'Reference',
              'Mobile',
              'Email',
              'GST',
              'PAN',
              'Actions',
            ]}
          >
            {!listLoading && clients.length === 0 ? (
              <EmptyTableRow
                colSpan={9}
                message={search ? 'No clients match your search.' : 'No clients yet. Click Add Client to create one.'}
              />
            ) : (
              clients.map((client) => {
                const selected = selectedIds.has(client._id);
                return (
                <tr
                  key={client._id}
                  className={`hover:bg-brand-50/50 ${selected ? 'bg-brand-50/40' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleClientSelection(client._id)}
                      aria-label={`Select ${client.name}`}
                      className="h-4 w-4 rounded border-border accent-brand-900"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-brand-700">{client.clientId || '—'}</td>
                  <td className="px-4 py-3 font-medium text-brand-800">{client.name}</td>
                  <td className="px-4 py-3">{client.reference || '—'}</td>
                  <td className="px-4 py-3">{client.mobile || '—'}</td>
                  <td className="px-4 py-3">{client.email || '—'}</td>
                  <td className="px-4 py-3">{client.gst || '—'}</td>
                  <td className="px-4 py-3">{client.pan || '—'}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(client)}
                      onDelete={() => setDeleteTarget(client)}
                    />
                  </td>
                </tr>
              );
              })
            )}
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            disabled={listLoading}
          />
        </Card>

        <Modal
          open={showForm}
          onClose={closeForm}
          title={editing ? 'Edit Client' : 'Add Client'}
          description={editing ? 'Update client details.' : 'Register a new client for your company.'}
          size="xl"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" autoComplete="off">
            {editing?.clientId && (
              <Input label="Client ID" value={editing.clientId} disabled />
            )}
            <Input label="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Reference (optional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <Input label="Mobile (optional)" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <div className="space-y-4 sm:col-span-2">
              <Input label="Address Line 1" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} required />
              <Input label="Address Line 2 (optional)" value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} />
            </div>
            <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input
              label="GSTIN (optional)"
              value={form.gst}
              onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })}
              placeholder={`e.g. ${TAX_ID_HINTS.gst}`}
              maxLength={TAX_ID_MAX_LENGTH.gst}
              autoComplete="off"
            />
            <Input
              label="PAN (optional)"
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              placeholder={`e.g. ${TAX_ID_HINTS.pan}`}
              maxLength={TAX_ID_MAX_LENGTH.pan}
              autoComplete="off"
            />
            <Input
              label="TAN (optional)"
              value={form.tan}
              onChange={(e) => setForm({ ...form, tan: e.target.value.toUpperCase() })}
              placeholder={`e.g. ${TAX_ID_HINTS.tan}`}
              maxLength={TAX_ID_MAX_LENGTH.tan}
              autoComplete="off"
            />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="State Code" value={form.stateCode} onChange={(e) => setForm({ ...form, stateCode: e.target.value })} />
            <Input label="Place of Supply" value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} />
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Client' : 'Save Client'}</Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete client?"
          message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone from the list.` : ''}
          confirmLabel="Yes, delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
