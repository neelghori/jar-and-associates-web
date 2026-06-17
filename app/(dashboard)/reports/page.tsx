'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { exportServiceClientReportToExcel } from '@/lib/exportServiceClientReportExcel';
import {
  buildServiceClientReport,
  type ServiceClientReportGroup,
} from '@/lib/serviceClientReport';
import { Alert, Button, Card, PageHeader, SectionTitle, Table } from '@/components/ui';
import type { Client, Service, Task } from '@/lib/types';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportGroups, setReportGroups] = useState<ServiceClientReportGroup[]>([]);

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const [tasksRes, clientsRes, servicesRes] = await Promise.all([
        api.getTasks(),
        api.getClients(),
        api.getServices(),
      ]);
      const groups = buildServiceClientReport(
        (tasksRes.tasks as Task[]) ?? [],
        (clientsRes.clients as Client[]) ?? [],
        (servicesRes.services as Service[]) ?? []
      );
      setReportGroups(groups);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load report data');
      setReportGroups([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  const summary = useMemo(() => {
    const servicesWithClients = reportGroups.filter((group) => group.clientCount > 0).length;
    const clientLinks = reportGroups.reduce((sum, group) => sum + group.clientCount, 0);
    const taskCount = reportGroups.reduce((sum, group) => sum + group.taskCount, 0);
    return {
      services: reportGroups.length,
      servicesWithClients,
      clientLinks,
      taskCount,
    };
  }, [reportGroups]);

  function handleExport() {
    if (reportGroups.length === 0) {
      setError('No services available to export');
      return;
    }
    if (summary.clientLinks === 0) {
      setError('No client-service records found yet');
      return;
    }

    setError('');
    setSuccess('');
    setExporting(true);
    try {
      exportServiceClientReportToExcel(reportGroups);
      setSuccess(
        `Exported all ${summary.services} services with ${summary.clientLinks} client record${summary.clientLinks === 1 ? '' : 's'} to Excel`
      );
    } catch {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Reports"
          subtitle="See which clients have taken each service, and export all services with client details in one Excel file."
        />

        {success && (
          <div className="mb-4">
            <Alert message={success} type="success" />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Alert message={error} />
          </div>
        )}

        <Card>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SectionTitle>Service-wise Client Report</SectionTitle>
              <p className="text-sm text-muted">
                Each service shows which clients have taken it. Export downloads one Excel with every service
                and its clients — e.g. GST taken by 10 clients, ITR taken by 5 clients, all in the same file.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={loadReport} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading || exporting || summary.clientLinks === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export All to Excel'}
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Services</p>
              <p className="mt-1 text-2xl font-semibold text-brand-900">{summary.services}</p>
            </div>
            <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">With clients</p>
              <p className="mt-1 text-2xl font-semibold text-brand-900">{summary.servicesWithClients}</p>
            </div>
            <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Client records</p>
              <p className="mt-1 text-2xl font-semibold text-brand-900">{summary.clientLinks}</p>
            </div>
            <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Tasks</p>
              <p className="mt-1 text-2xl font-semibold text-brand-900">{summary.taskCount}</p>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted">Loading report...</p>
          ) : reportGroups.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No services found yet.</p>
          ) : (
            <div className="space-y-6">
              {reportGroups.map((group) => (
                <div key={group.serviceId} className="rounded-xl border border-border">
                  <div className="border-b border-border bg-brand-50/60 px-4 py-3">
                    <h3 className="font-semibold text-brand-900">{group.serviceName}</h3>
                    <p className="text-xs text-muted">
                      SAC: {group.sacCode || '—'} · {group.clientCount} client
                      {group.clientCount === 1 ? '' : 's'} · {group.taskCount} task
                      {group.taskCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {group.clients.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted">No clients have taken this service yet.</p>
                  ) : (
                    <Table
                      headers={[
                        'Client ID',
                        'Client Name',
                        'Reference',
                        'Mobile',
                        'Email',
                        'GST',
                        'PAN',
                        'TAN',
                        'State',
                        'Tasks',
                      ]}
                    >
                      {group.clients.map((row) => (
                        <tr key={row.clientDbId} className="hover:bg-brand-50/50">
                          <td className="px-4 py-3 font-mono text-sm text-brand-700">{row.clientId || '—'}</td>
                          <td className="px-4 py-3 font-medium text-brand-800">{row.clientName || '—'}</td>
                          <td className="px-4 py-3">{row.reference || '—'}</td>
                          <td className="px-4 py-3">{row.mobile || '—'}</td>
                          <td className="px-4 py-3">{row.email || '—'}</td>
                          <td className="px-4 py-3">{row.gst || '—'}</td>
                          <td className="px-4 py-3">{row.pan || '—'}</td>
                          <td className="px-4 py-3">{row.tan || '—'}</td>
                          <td className="px-4 py-3">{row.state || '—'}</td>
                          <td className="px-4 py-3">{row.taskCount}</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </CompanyRequired>
  );
}
