'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { filterBySearch } from '@/lib/filterList';
import { canManageCompanies, isCompanySuperadmin, isPlatformAdmin } from '@/lib/roles';
import { Modal } from '@/components/Modal';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { Alert, Button, Card, Input, PageHeader, Table } from '@/components/ui';
import { TopBar } from '@/components/Sidebar';
import type { Company } from '@/lib/types';
import {
  getPanError,
  getTanError,
  normalizeTaxPayload,
  TAX_ID_HINTS,
  TAX_ID_MAX_LENGTH,
} from '@/lib/indianTaxIds';

const emptyCompanyForm = {
  name: '', address1: '', address2: '', mobile: '', email: '', pan: '', tan: '', sacCode: '',
  bankName: '', branchName: '', ifscCode: '', accountNumber: '',
  isCharteredAccountant: true,
};

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const platformView = isPlatformAdmin(user);
  const companyView = isCompanySuperadmin(user);

  async function loadCompanies() {
    const res = await api.getCompanies();
    const list = res.companies as Company[];
    setCompanies(list);
    if (companyView && list[0]) {
      setCompany(list[0]);
      fillCompanyForm(list[0]);
    }
  }

  function fillCompanyForm(data: Company) {
    setCompanyForm({
      name: data.name,
      address1: data.address1 ?? '',
      address2: data.address2 ?? '',
      mobile: data.mobile,
      email: data.email,
      pan: data.pan || '',
      tan: data.tan ?? '',
      sacCode: data.sacCode ?? '',
      bankName: data.bankName,
      branchName: data.branchName,
      ifscCode: data.ifscCode,
      accountNumber: data.accountNumber || '',
      isCharteredAccountant: data.isCharteredAccountant,
    });
  }

  useEffect(() => {
    if (canManageCompanies(user) || companyView) {
      loadCompanies().catch(console.error);
    }
  }, [user?.role]);

  if (!canManageCompanies(user) && !companyView) {
    return <Alert message="You do not have permission to manage companies." />;
  }

  function validateCompanyTaxIds() {
    const panErr = getPanError(companyForm.pan);
    if (panErr) return panErr;
    return getTanError(companyForm.tan);
  }

  async function handleCreateCompany(e: FormEvent) {
    e.preventDefault();
    setError('');
    const taxError = validateCompanyTaxIds();
    if (taxError) {
      setError(taxError);
      return;
    }
    setSuccess('');
    setLoading(true);
    try {
      await api.createCompany(normalizeTaxPayload(companyForm));
      setSuccess('Company created successfully.');
      setCompanyForm(emptyCompanyForm);
      setShowCreate(false);
      await loadCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCompany(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setError('');
    const taxError = validateCompanyTaxIds();
    if (taxError) {
      setError(taxError);
      return;
    }
    setSuccess('');
    setLoading(true);
    try {
      await api.updateCompany(company.id, normalizeTaxPayload(companyForm));
      setSuccess('Company updated successfully');
      await loadCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update company');
    } finally {
      setLoading(false);
    }
  }

  const filteredCompanies = useMemo(
    () =>
      filterBySearch(companies, search, (item) => [
        item.companyCode,
        item.name,
        item.email,
        item.superadmin?.name,
        item.superadmin?.email,
        item.isCharteredAccountant ? 'yes' : 'no',
      ]),
    [companies, search]
  );

  if (platformView) {
    return (
      <div>
        <TopBar title="Platform administration" />
        <PageHeader
          hideLogo
          title="Companies"
          subtitle="Create and manage companies. Assign a superadmin from the Users page when adding a company owner."
          action={
            <Button onClick={() => { setShowCreate(true); setError(''); }}>
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by code, name, email, or superadmin..."
            total={companies.length}
            filtered={filteredCompanies.length}
          />

          <Table headers={['Code', 'Company', 'Email', 'Superadmin', 'CA Firm']}>
            {filteredCompanies.length === 0 ? (
              <EmptyTableRow
                colSpan={5}
                message={search ? 'No companies match your search.' : 'No companies yet. Click Create Company to add one.'}
              />
            ) : (
              filteredCompanies.map((item) => (
                <tr key={item.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-700">{item.companyCode}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">
                    {item.superadmin ? (
                      <span>{item.superadmin.name}<br /><span className="text-xs text-muted">{item.superadmin.email}</span></span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.isCharteredAccountant ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create company"
          description="Enter company details. Add the company superadmin from the Users page."
          size="xl"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleCreateCompany} className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
            <Input label="Mobile" value={companyForm.mobile} onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })} required />
            <Input label="Address Line 1" value={companyForm.address1} onChange={(e) => setCompanyForm({ ...companyForm, address1: e.target.value })} required />
            <Input label="Address Line 2 (optional)" value={companyForm.address2} onChange={(e) => setCompanyForm({ ...companyForm, address2: e.target.value })} />
            <Input label="Company Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} required />
            <Input
              label="PAN (optional)"
              value={companyForm.pan}
              onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })}
              placeholder={`e.g. ${TAX_ID_HINTS.pan}`}
              maxLength={TAX_ID_MAX_LENGTH.pan}
              autoComplete="off"
            />
            <Input
              label="TAN (optional)"
              value={companyForm.tan}
              onChange={(e) => setCompanyForm({ ...companyForm, tan: e.target.value.toUpperCase() })}
              placeholder={`e.g. ${TAX_ID_HINTS.tan}`}
              maxLength={TAX_ID_MAX_LENGTH.tan}
              autoComplete="off"
            />
            <Input
              label="SAC code (optional, for invoice)"
              value={companyForm.sacCode}
              onChange={(e) => setCompanyForm({ ...companyForm, sacCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="e.g. 9982"
              maxLength={6}
            />
            <Input label="Bank Name" value={companyForm.bankName} onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })} required />
            <Input label="Branch Name" value={companyForm.branchName} onChange={(e) => setCompanyForm({ ...companyForm, branchName: e.target.value })} required />
            <Input label="IFSC Code" value={companyForm.ifscCode} onChange={(e) => setCompanyForm({ ...companyForm, ifscCode: e.target.value })} required />
            <Input label="Account Number" value={companyForm.accountNumber} onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })} required />
            <label className="flex items-center gap-2 sm:col-span-2 text-sm">
              <input
                type="checkbox"
                checked={companyForm.isCharteredAccountant}
                onChange={(e) => setCompanyForm({ ...companyForm, isCharteredAccountant: e.target.checked })}
              />
              Is Chartered Accountant (CA) firm
            </label>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Creating...' : 'Create company'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Company profile" />
      <PageHeader
        hideLogo
        title="My Company"
        subtitle={company ? `Company Code: ${company.companyCode}` : 'Update your company profile'}
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && <div className="mb-4"><Alert message={success} type="success" /></div>}

      <Card className="max-w-3xl">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <Building2 className="h-5 w-5" />
          Company superadmins can update firm details used on invoices. Contact platform admin to create new companies.
        </div>
        <form onSubmit={handleUpdateCompany} className="grid gap-4 sm:grid-cols-2">
          <Input label="Company Name" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
          <Input label="Mobile" value={companyForm.mobile} onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })} required />
          <div className="sm:col-span-2">
            <Input label="Address Line 1" value={companyForm.address1} onChange={(e) => setCompanyForm({ ...companyForm, address1: e.target.value })} required />
            <Input label="Address Line 2 (optional)" value={companyForm.address2} onChange={(e) => setCompanyForm({ ...companyForm, address2: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} required />
          <Input
            label="PAN (optional)"
            value={companyForm.pan}
            onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })}
            placeholder={`e.g. ${TAX_ID_HINTS.pan}`}
            maxLength={TAX_ID_MAX_LENGTH.pan}
            autoComplete="off"
          />
          <Input
            label="TAN (optional)"
            value={companyForm.tan}
            onChange={(e) => setCompanyForm({ ...companyForm, tan: e.target.value.toUpperCase() })}
            placeholder={`e.g. ${TAX_ID_HINTS.tan}`}
            maxLength={TAX_ID_MAX_LENGTH.tan}
            autoComplete="off"
          />
          <Input
            label="SAC code (optional, for invoice)"
            value={companyForm.sacCode}
            onChange={(e) => setCompanyForm({ ...companyForm, sacCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="e.g. 9982"
            maxLength={6}
          />
          <Input label="Bank Name" value={companyForm.bankName} onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })} required />
          <Input label="Branch Name" value={companyForm.branchName} onChange={(e) => setCompanyForm({ ...companyForm, branchName: e.target.value })} required />
          <Input label="IFSC Code" value={companyForm.ifscCode} onChange={(e) => setCompanyForm({ ...companyForm, ifscCode: e.target.value })} required />
          <Input label="Account Number" value={companyForm.accountNumber} onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })} required />
          <label className="flex items-center gap-2 sm:col-span-2 text-sm">
            <input
              type="checkbox"
              checked={companyForm.isCharteredAccountant}
              onChange={(e) => setCompanyForm({ ...companyForm, isCharteredAccountant: e.target.checked })}
            />
            Is Chartered Accountant (CA) firm
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading || !company}>
              {loading ? 'Saving...' : 'Update Company'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
