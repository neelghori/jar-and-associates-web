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
import { Alert, Button, Card, Input, PageHeader, Table } from '@/components/ui';
import type { Service } from '@/lib/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadServices() {
    const res = await api.getServices();
    setServices(res.services as Service[]);
  }

  useEffect(() => { loadServices().catch(console.error); }, []);

  const filteredServices = useMemo(
    () => filterBySearch(services, search, (s) => [s.name, s.description, s.defaultAmount]),
    [services, search]
  );

  function openCreate() {
    setEditing(null);
    setName('');
    setDefaultAmount('');
    setError('');
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setDefaultAmount(service.defaultAmount != null ? String(service.defaultAmount) : '');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setName('');
    setDefaultAmount('');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { name, defaultAmount: defaultAmount ? Number(defaultAmount) : 0 };
      if (editing) {
        await api.updateService(editing._id, payload);
        setSuccess('Service updated successfully');
      } else {
        await api.createService(payload);
        setSuccess('Service created successfully');
      }
      closeForm();
      await loadServices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save service');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteService(deleteTarget._id);
      setSuccess('Service deleted successfully');
      setDeleteTarget(null);
      await loadServices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete service');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Services"
          subtitle="Search, edit, or remove services used in tasks and invoices."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by service name..."
            total={services.length}
            filtered={filteredServices.length}
          />

          <Table headers={['Service Name', 'Default Amount', 'Actions']}>
            {filteredServices.length === 0 ? (
              <EmptyTableRow
                colSpan={3}
                message={search ? 'No services match your search.' : 'No services yet. Click Add Service to create one.'}
              />
            ) : (
              filteredServices.map((service) => (
                <tr key={service._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{service.name}</td>
                  <td className="px-4 py-3">₹ {service.defaultAmount?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(service)}
                      onDelete={() => setDeleteTarget(service)}
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
          title={editing ? 'Edit Service' : 'Add Service'}
          description="Master service for task and invoice line items."
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Service Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Default Amount (optional)" type="number" min="0" step="0.01" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Service' : 'Save Service'}</Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete service?"
          message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"?` : ''}
          confirmLabel="Yes, delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
