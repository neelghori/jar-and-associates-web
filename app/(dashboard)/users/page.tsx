'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { filterBySearch } from '@/lib/filterList';
import { canManageCompanyUsers, isPlatformAdmin } from '@/lib/roles';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { Alert, Button, Card, Input, PageHeader, Select, Table } from '@/components/ui';
import { TopBar } from '@/components/Sidebar';
import type { Company, User } from '@/lib/types';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
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

  async function loadUsers() {
    const res = await api.getUsers();
    setUsers(res.users as User[]);
  }

  useEffect(() => {
    if (!canManageCompanyUsers(currentUser)) return;
    loadUsers().catch(console.error);
    if (platformView) {
      api.getCompanies().then((res) => setCompanies(res.companies as Company[])).catch(console.error);
    }
  }, [currentUser?.role, platformView]);

  function companyLabel(entry: User) {
    if (!entry.company) return '—';
    if (typeof entry.company === 'string') return entry.company;
    return `${entry.company.companyCode} — ${entry.company.name}`;
  }

  const filteredUsers = useMemo(
    () =>
      filterBySearch(users, search, (entry) => [
        entry.name,
        entry.email,
        entry.role,
        companyLabel(entry),
        entry.isActive ? 'active' : 'inactive',
      ]),
    [users, search]
  );

  if (!canManageCompanyUsers(currentUser)) {
    return <Alert message="You do not have permission to manage users." />;
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: platformView ? 'superadmin' : 'employee', company: '' });
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
        const payload = platformView
          ? { name: form.name, email: form.email, password: form.password, role: 'superadmin' as const, company: form.company }
          : { name: form.name, email: form.email, password: form.password, role: form.role };
        await api.createUser(payload);
        setSuccess('User created successfully');
      }
      closeForm();
      await loadUsers();
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
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <TopBar title={platformView ? 'Manage users across companies' : 'Manage your company team'} />
      <PageHeader
        hideLogo
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
          total={users.length}
          filtered={filteredUsers.length}
        />

        <Table headers={['Name', 'Email', 'Role', 'Company', 'Status', 'Actions']}>
          {filteredUsers.length === 0 ? (
            <EmptyTableRow
              colSpan={6}
              message={search ? 'No users match your search.' : 'No users yet. Click Add User to create one.'}
            />
          ) : (
            filteredUsers.map((entry) => (
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
              <Select
                label="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              >
                <option value="">Select company</option>
                {companies
                  .filter((c) => !c.superadmin)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyCode} — {c.name}
                    </option>
                  ))}
              </Select>
              <p className="text-sm text-muted rounded-xl border border-border bg-brand-50 px-3 py-2">
                Role: <strong>Superadmin</strong> (company owner)
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
