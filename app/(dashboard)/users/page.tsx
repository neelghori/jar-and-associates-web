'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { canManageCompanyUsers, isPlatformAdmin } from '@/lib/roles';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { RowActions } from '@/components/RowActions';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mapPaginatedList } from '@/lib/listApi';
import { Alert, Button, Card, Input, PageHeader, Select, Table } from '@/components/ui';
import type { Company, User } from '@/lib/types';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const canManage = canManageCompanyUsers(currentUser);
  const fetchUsers = useCallback(
    async (params: Record<string, string>) => mapPaginatedList<User>('users', await api.getUsers(params)),
    []
  );
  const {
    items: users,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    loading: listLoading,
    reload,
  } = usePaginatedList({ fetchList: fetchUsers, enabled: canManage });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'superadmin' | 'employee',
    company: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const platformView = isPlatformAdmin(currentUser);

  useEffect(() => {
    if (!canManage) return;
    if (platformView) {
      api
        .getCompanies()
        .then((res) => {
          const list = res.companies as Company[];
          setCompanies(list);
          if (list.length === 1) {
            setForm((prev) => (prev.company ? prev : { ...prev, company: list[0].id }));
          }
        })
        .catch(console.error);
    }
  }, [canManage, platformView]);

  function companyLabel(entry: User) {
    if (!entry.company) return '—';
    if (typeof entry.company === 'string') return entry.company;
    return `${entry.company.companyCode} — ${entry.company.name}`;
  }

  if (!canManage) {
    return <Alert message="You do not have permission to manage users." />;
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      password: '',
      role: platformView ? 'superadmin' : 'employee',
      company: companies.length === 1 ? companies[0].id : '',
    });
    setError('');
    setShowForm(true);
  }

  function openEdit(entry: User) {
    setEditing(entry);
    setForm({
      name: entry.name,
      email: entry.email,
      password: '',
      role: entry.role === 'superadmin' || entry.role === 'employee' ? entry.role : 'employee',
      company: typeof entry.company === 'object' ? entry.company.id : (entry.company || ''),
    });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError('');
  }

  function canModifyUser(entry: User) {
    if (entry.id === currentUser?.id) return false;
    if (entry.role === 'platform_admin') return false;
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (editing) {
        const payload: Record<string, string> = { name: form.name, email: form.email };
        if (form.password) payload.password = form.password;
        if (!platformView && form.role) payload.role = form.role;
        await api.updateUser(editing.id, payload);
        setSuccess('User updated successfully');
      } else {
        const organizationId = form.company || (companies.length === 1 ? companies[0].id : '');
        const payload = platformView
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              role: 'superadmin' as const,
              company: organizationId,
            }
          : { name: form.name, email: form.email, password: form.password, role: form.role };
        await api.createUser(payload);
        setSuccess('User created successfully');
      }
      closeForm();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setSuccess('User deactivated successfully');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={
          platformView
            ? 'Create company superadmins, edit details, or deactivate users (with confirmation).'
            : 'Add employees, edit details, or deactivate users (with confirmation).'
        }
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
      {error && !showForm && !deleteTarget && <div className="mb-4"><Alert message={error} /></div>}

      <Card>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by name, email, role, or company..."
          total={total}
          page={page}
          limit={limit}
          loading={listLoading}
        />

        <Table headers={['Name', 'Email', 'Role', 'Company', 'Status', 'Actions']}>
          {!listLoading && users.length === 0 ? (
            <EmptyTableRow
              colSpan={6}
              message={search ? 'No users match your search.' : 'No users yet. Click Add User to create one.'}
            />
          ) : (
            users.map((entry) => (
              <tr key={entry.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3 font-medium text-brand-800">{entry.name}</td>
                <td className="px-4 py-3">{entry.email}</td>
                <td className="px-4 py-3 capitalize">{entry.role.replace('_', ' ')}</td>
                <td className="px-4 py-3">{companyLabel(entry)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {entry.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canModifyUser(entry) && entry.isActive ? (
                    <RowActions
                      onEdit={() => openEdit(entry)}
                      onDelete={() => setDeleteTarget(entry)}
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
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
          disabled={listLoading}
        />
      </Card>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editing ? 'Edit User' : 'Add User'}
        description={
          editing
            ? 'Update name or email. Leave password blank to keep the current password.'
            : platformView
              ? 'Create a company superadmin and assign them to a company.'
              : 'Create an employee for your company workspace.'
        }
        size="md"
      >
        {error && <div className="mb-4"><Alert message={error} /></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input
            label={editing ? 'New password (optional)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
            minLength={editing ? undefined : 8}
          />
          {!platformView && (
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'superadmin' | 'employee' })}
              disabled={!!editing && editing.role === 'superadmin'}
            >
              <option value="employee">Employee</option>
              <option value="superadmin">Superadmin</option>
            </Select>
          )}
          {platformView && !editing && (
            <>
              {companies.length === 1 ? (
                <Input
                  label="Organization"
                  value={`${companies[0].companyCode} — ${companies[0].name}`}
                  disabled
                />
              ) : (
                <Select
                  label="Organization"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                >
                  <option value="">Select organization</option>
                  {companies
                    .filter((c) => !c.superadmin)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyCode} — {c.name}
                      </option>
                    ))}
                </Select>
              )}
              <p className="text-sm text-muted rounded-xl border border-border bg-brand-50 px-3 py-2">
                Role: <strong>Superadmin</strong> (organization owner)
              </p>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : editing ? 'Update User' : 'Save User'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate user?"
        message={deleteTarget ? `Are you sure you want to deactivate "${deleteTarget.name}"? They will no longer be able to sign in.` : ''}
        confirmLabel="Yes, deactivate"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
