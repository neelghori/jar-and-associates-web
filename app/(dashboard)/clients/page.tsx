'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { filterBySearch } from '@/lib/filterList';
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
  mobile: '', email: '', state: '', stateCode: '', placeOfSupply: '',
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
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadClients() {
    const res = await api.getClients();
    setClients(res.clients as Client[]);
  }

  useEffect(() => { loadClients().catch(console.error); }, []);

  const filteredClients = useMemo(
    () =>
      filterBySearch(clients, search, (c) => [
        c.clientId, c.name, c.mobile, c.email, c.gst, c.pan, c.tan, c.address1, c.address2, c.state,
      ]),
    [clients, search]
  );

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
      await loadClients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save client');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteClient(deleteTarget._id);
      setSuccess('Client deleted successfully');
      setDeleteTarget(null);
      await loadClients();
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
          subtitle="Browse, edit, or remove clients. Deleting asks for confirmation once."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by client ID, name, email, mobile, GST, PAN..."
            total={clients.length}
            filtered={filteredClients.length}
          />

          <Table headers={['Client ID', 'Name', 'Mobile', 'Email', 'GST', 'PAN', 'Actions']}>
            {filteredClients.length === 0 ? (
              <EmptyTableRow
                colSpan={7}
                message={search ? 'No clients match your search.' : 'No clients yet. Click Add Client to create one.'}
              />
            ) : (
              filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-mono text-sm text-brand-700">{client.clientId || '—'}</td>
                  <td className="px-4 py-3 font-medium text-brand-800">{client.name}</td>
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
              ))
            )}
          </Table>
        </Card>

        <Modal
          open={showForm}
          onClose={closeForm}
          title={editing ? 'Edit Client' : 'Add Client'}
          description={editing ? 'Update client details.' : 'Register a new client for your company.'}
          size="xl"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {editing?.clientId && (
              <Input label="Client ID" value={editing.clientId} disabled />
            )}
            <Input label="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Mobile (optional)" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <div className="sm:col-span-2">
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
