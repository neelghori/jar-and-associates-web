'use client';

import { FormEvent, useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { Pagination } from '@/components/Pagination';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mapPaginatedList } from '@/lib/listApi';
import { Alert, Button, Card, Input, PageHeader, Table } from '@/components/ui';
import type { Service } from '@/lib/types';

function normalizeSacInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function isValidSac(value: string) {
  return /^\d{4,6}$/.test(value.trim());
}

export default function ServicesPage() {
  const fetchServices = useCallback(
    async (params: Record<string, string>) => mapPaginatedList<Service>('services', await api.getServices(params)),
    []
  );
  const {
    items: services,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    setLimit,
    loading: listLoading,
    reload,
  } = usePaginatedList({ fetchList: fetchServices });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [sacCode, setSacCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setName('');
    setSacCode('');
    setError('');
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setSacCode(service.sacCode ?? '');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setName('');
    setSacCode('');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedSac = normalizeSacInput(sacCode);
    if (normalizedSac && !isValidSac(normalizedSac)) {
      setError('SAC code must be 4–6 digits when provided');
      return;
    }

    setLoading(true);
    try {
      const payload = { name, sacCode: normalizedSac || '' };
      if (editing) {
        await api.updateService(editing._id, payload);
        setSuccess('Service updated successfully');
      } else {
        await api.createService(payload);
        setSuccess('Service created successfully');
      }
      closeForm();
      await reload();
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
      await reload();
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
            total={total}
            page={page}
            limit={limit}
            loading={listLoading}
          />

          <Table headers={['Service Name', 'SAC Code', 'Actions']}>
            {!listLoading && services.length === 0 ? (
              <EmptyTableRow
                colSpan={3}
                message={search ? 'No services match your search.' : 'No services yet. Click Add Service to create one.'}
              />
            ) : (
              services.map((service) => (
                <tr key={service._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{service.name}</td>
                  <td className="px-4 py-3">{service.sacCode || '—'}</td>
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
          onClose={closeForm}
          title={editing ? 'Edit Service' : 'Add Service'}
          description="Optionally add a SAC code that appears on invoice line items for this service."
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Service Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="SAC Code (optional)"
              value={sacCode}
              onChange={(e) => setSacCode(normalizeSacInput(e.target.value))}
              placeholder="e.g. 9982"
              maxLength={6}
            />
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
