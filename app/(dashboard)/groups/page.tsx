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
import type { Group } from '@/lib/types';

export default function GroupsPage() {
  const fetchGroups = useCallback(
    async (params: Record<string, string>) => mapPaginatedList<Group>('groups', await api.getGroups(params)),
    []
  );
  const {
    items: groups,
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
  } = usePaginatedList({ fetchList: fetchGroups });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setName('');
    setError('');
    setShowForm(true);
  }

  function openEdit(group: Group) {
    setEditing(group);
    setName(group.name);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setName('');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { name };
      if (editing) {
        await api.updateGroup(editing._id, payload);
        setSuccess('Group updated successfully');
      } else {
        await api.createGroup(payload);
        setSuccess('Group created successfully');
      }
      closeForm();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save group');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteGroup(deleteTarget._id);
      setSuccess('Group deleted successfully');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete group');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Groups"
          subtitle="Create and manage client groups. Assign a group when adding or editing a client."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by group name..."
            total={total}
            page={page}
            limit={limit}
            loading={listLoading}
          />

          <Table headers={['Group Name', 'Actions']}>
            {!listLoading && groups.length === 0 ? (
              <EmptyTableRow
                colSpan={2}
                message={search ? 'No groups match your search.' : 'No groups yet. Click Add Group to create one.'}
              />
            ) : (
              groups.map((group) => (
                <tr key={group._id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{group.name}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(group)}
                      onDelete={() => setDeleteTarget(group)}
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
          title={editing ? 'Edit Group' : 'Add Group'}
          description="Groups help organize clients. The group can be selected when adding a client."
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Group' : 'Save Group'}</Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete group?"
          message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? Clients in this group will keep their other details but lose the group assignment.` : ''}
          confirmLabel="Yes, delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
