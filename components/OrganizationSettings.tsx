'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { canManageCompanies, isCompanySuperadmin, isPlatformAdmin } from '@/lib/roles';
import { DEFAULT_COMPANY_NAME } from '@/lib/organization';
import { Alert, Button, Card, Input } from '@/components/ui';
import type { Company } from '@/lib/types';
import {
  getPanError,
  getTanError,
  normalizeTaxPayload,
  TAX_ID_HINTS,
  TAX_ID_MAX_LENGTH,
} from '@/lib/indianTaxIds';

const emptyCompanyForm = {
  name: DEFAULT_COMPANY_NAME,
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

export function OrganizationSettings() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const platformView = isPlatformAdmin(user);
  const companyView = isCompanySuperadmin(user);

  async function loadCompanies() {
    const res = await api.getCompanies();
    const list = res.companies as Company[];
    if (list[0]) {
      setCompany(list[0]);
      fillCompanyForm(list[0]);
    } else {
      setCompany(null);
      setCompanyForm(emptyCompanyForm);
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
    return <Alert message="You do not have permission to manage the organization." />;
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
      setSuccess('Organization created successfully.');
      await loadCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create organization');
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
      setSuccess('Organization updated successfully');
      await loadCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert message={success} type="success" />
        </div>
      )}

      <Card className="max-w-3xl">
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-700">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="min-w-0">
            {platformView ? (
              <>
                Only one organization ({DEFAULT_COMPANY_NAME}) is allowed on this platform. Billing
                firms are added under <strong className="font-semibold">Companies</strong> in the
                company workspace.
              </>
            ) : (
              <>
                This is the main organization profile. Add billing firms under{' '}
                <strong className="font-semibold">Companies</strong> in the sidebar for invoice
                generation. Manage it from <strong className="font-semibold">Profile</strong>.
              </>
            )}
          </p>
        </div>

        {company && (
          <p className="mb-4 text-sm text-muted">Company Code: {company.companyCode}</p>
        )}

        <form
          onSubmit={company ? handleUpdateCompany : handleCreateCompany}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Input
            label="Organization Name"
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
          />
          <Input
            label="Mobile"
            value={companyForm.mobile}
            onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Address Line 1"
              value={companyForm.address1}
              onChange={(e) => setCompanyForm({ ...companyForm, address1: e.target.value })}
              required
            />
            <Input
              label="Address Line 2 (optional)"
              value={companyForm.address2}
              onChange={(e) => setCompanyForm({ ...companyForm, address2: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={companyForm.email}
            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
            required
          />
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
            onChange={(e) =>
              setCompanyForm({ ...companyForm, sacCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
            }
            placeholder="e.g. 9982"
            maxLength={6}
          />
          <Input
            label="Bank Name"
            value={companyForm.bankName}
            onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
            required
          />
          <Input
            label="Branch Name"
            value={companyForm.branchName}
            onChange={(e) => setCompanyForm({ ...companyForm, branchName: e.target.value })}
            required
          />
          <Input
            label="IFSC Code"
            value={companyForm.ifscCode}
            onChange={(e) => setCompanyForm({ ...companyForm, ifscCode: e.target.value })}
            required
          />
          <Input
            label="Account Number"
            value={companyForm.accountNumber}
            onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })}
            required={!company}
            placeholder={company ? 'Leave blank to keep current' : undefined}
          />
          <label className="flex items-center gap-2 sm:col-span-2 text-sm">
            <input
              type="checkbox"
              checked={companyForm.isCharteredAccountant}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, isCharteredAccountant: e.target.checked })
              }
            />
            Is Chartered Accountant (CA) firm
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : company ? 'Update Organization' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
