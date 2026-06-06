'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, fetchSubCompanyLogoBlob } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { filterBySearch } from '@/lib/filterList';
import {
  getPanError,
  getTanError,
  normalizeTaxPayload,
  TAX_ID_HINTS,
  TAX_ID_MAX_LENGTH,
} from '@/lib/indianTaxIds';
import { useAuth } from '@/lib/auth-context';
import { isCompanySuperadmin } from '@/lib/roles';
import { Alert, Button, Card, Input, PageHeader, Table } from '@/components/ui';
import { DEFAULT_COMPANY_NAME } from '@/lib/organization';
import type { SubCompany } from '@/lib/types';

const emptyForm = {
  name: '',
  address1: '',
  address2: '',
  mobile: '',
  email: '',
  pan: '',
  tan: '',
  sacCode: '',
  bankName: '',
  branchName: '',
  ifscCode: '',
  accountNumber: '',
  isCharteredAccountant: true,
};

function subCompanyToForm(item: SubCompany) {
  return {
    name: item.name,
    address1: item.address1 || '',
    address2: item.address2 || '',
    mobile: item.mobile,
    email: item.email,
    pan: item.pan || '',
    tan: item.tan || '',
    sacCode: item.sacCode || '',
    bankName: item.bankName,
    branchName: item.branchName,
    ifscCode: item.ifscCode,
    accountNumber: item.accountNumber || '',
    isCharteredAccountant: item.isCharteredAccountant,
  };
}

export default function SubCompaniesPage() {
  const { user } = useAuth();
  const [subCompanies, setSubCompanies] = useState<SubCompany[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubCompany | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCompany | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);

  const canManage = isCompanySuperadmin(user);

  function clearLogoPreview() {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setLogoFile(null);
  }

  async function loadLogoPreview(item: SubCompany) {
    clearLogoPreview();
    if (!item.hasLogo) return;
    const blob = await fetchSubCompanyLogoBlob(item.id);
    if (blob) setLogoPreview(URL.createObjectURL(blob));
  }

  async function loadSubCompanies() {
    const res = await api.getSubCompanies();
    setSubCompanies(res.subCompanies as SubCompany[]);
  }

  useEffect(() => {
    loadSubCompanies().catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const filtered = useMemo(
    () =>
      filterBySearch(subCompanies, search, (item) => [
        item.name,
        item.email,
        item.mobile,
        item.pan,
        item.tan,
        item.bankName,
      ]),
    [subCompanies, search]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    clearLogoPreview();
    setError('');
    setShowForm(true);
  }

  function openEdit(item: SubCompany) {
    setEditing(item);
    setForm(subCompanyToForm(item));
    clearLogoPreview();
    setError('');
    setShowForm(true);
    loadLogoPreview(item).catch(console.error);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    clearLogoPreview();
    setError('');
  }

  function onLogoSelected(file: File | null) {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleRemoveLogo() {
    if (logoFile || (logoPreview && !editing?.hasLogo)) {
      clearLogoPreview();
      return;
    }
    if (!editing?.hasLogo) return;
    setLogoLoading(true);
    setError('');
    try {
      await api.deleteSubCompanyLogo(editing.id);
      clearLogoPreview();
      setEditing({ ...editing, hasLogo: false });
      await loadSubCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove logo');
    } finally {
      setLogoLoading(false);
    }
  }

  function validateTaxIds() {
    const panErr = getPanError(form.pan);
    if (panErr) return panErr;
    return getTanError(form.tan);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const taxError = validateTaxIds();
    if (taxError) {
      setError(taxError);
      return;
    }
    setLoading(true);
    try {
      let savedId = editing?.id;
      if (editing) {
        await api.updateSubCompany(editing.id, normalizeTaxPayload(form));
        setSuccess('Company updated successfully');
      } else {
        const res = await api.createSubCompany(normalizeTaxPayload(form));
        savedId = (res.subCompany as SubCompany).id;
        setSuccess('Company created successfully');
      }

      if (logoFile && savedId) {
        await api.uploadSubCompanyLogo(savedId, logoFile);
        setSuccess(
          editing ? 'Company and logo updated successfully' : 'Company created with logo successfully'
        );
      }

      closeForm();
      await loadSubCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save company');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteSubCompany(deleteTarget.id);
      setSuccess('Company deleted successfully');
      setDeleteTarget(null);
      await loadSubCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete company');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Companies"
          subtitle={`Add billing companies under ${DEFAULT_COMPANY_NAME}. Select one when generating an invoice.`}
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            ) : undefined
          }
        />

        {success && (
          <div className="mb-4">
            <Alert message={success} type="success" />
          </div>
        )}
        {error && !showForm && !deleteTarget && (
          <div className="mb-4">
            <Alert message={error} />
          </div>
        )}

        <Card>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <Building2 className="h-5 w-5 shrink-0" />
            The main organization ({DEFAULT_COMPANY_NAME}) is under Organization. These companies are
            used on invoice PDFs when you bill under a specific firm or branch.
          </div>

          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by name, email, or bank..."
            total={subCompanies.length}
            filtered={filtered.length}
          />

          <Table headers={['Name', 'Email', 'Mobile', 'Bank', 'Logo', 'CA Firm', ...(canManage ? ['Actions'] : [])]}>
            {filtered.length === 0 ? (
              <EmptyTableRow
                colSpan={canManage ? 7 : 6}
                message={
                  search
                    ? 'No companies match your search.'
                    : 'No companies yet. Add one to use on invoices.'
                }
              />
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-800">{item.name}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">{item.mobile}</td>
                  <td className="px-4 py-3">{item.bankName}</td>
                  <td className="px-4 py-3">{item.hasLogo ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3">{item.isCharteredAccountant ? 'Yes' : 'No'}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleteTarget(item)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Modal
          open={showForm}
          onClose={closeForm}
          title={editing ? 'Edit company' : 'Add company'}
          description="Details appear on the invoice PDF. Upload a logo to show it top-left on invoices."
          size="xl"
        >
          {error && (
            <div className="mb-4">
              <Alert message={error} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-xl border border-border bg-brand-50/40 p-4">
              <p className="mb-3 text-sm font-medium text-brand-800">Company logo (invoice top-left)</p>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-white">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted" />
                  )}
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={(e) => onLogoSelected(e.target.files?.[0] ?? null)}
                    className="text-sm text-brand-800 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800"
                  />
                  <p className="text-xs text-muted">PNG, JPG, GIF, or WebP. Max 2 MB. Shown top-left on invoice PDF.</p>
                  {(logoPreview || editing?.hasLogo) && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-fit px-2 text-xs text-danger"
                      disabled={logoLoading}
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
            />
            <Input
              label="Address Line 1"
              value={form.address1}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
            />
            <Input
              label="Address Line 2 (optional)"
              value={form.address2}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
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
            <Input
              label="SAC code (optional, default for invoice lines)"
              value={form.sacCode}
              onChange={(e) =>
                setForm({ ...form, sacCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }
              placeholder="e.g. 9982"
              maxLength={6}
            />
            <Input
              label="Bank Name"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              required
            />
            <Input
              label="Branch Name"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              required
            />
            <Input
              label="IFSC Code"
              value={form.ifscCode}
              onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
              required
            />
            <Input
              label="Account Number"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              required={!editing}
              placeholder={editing ? 'Leave blank to keep current' : undefined}
            />
            <label className="flex items-center gap-2 sm:col-span-2 text-sm">
              <input
                type="checkbox"
                checked={form.isCharteredAccountant}
                onChange={(e) => setForm({ ...form, isCharteredAccountant: e.target.checked })}
              />
              Is Chartered Accountant (CA) firm
            </label>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete company?"
          message={`Remove "${deleteTarget?.name}"? Existing invoices keep their PDF; new invoices cannot select this company.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
