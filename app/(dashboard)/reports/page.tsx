'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { exportClientTaskReportToExcel } from '@/lib/exportClientTaskReportExcel';
import { exportServiceClientReportToExcel } from '@/lib/exportServiceClientReportExcel';
import {
  buildClientTaskReport,
  filterClientTaskReportGroups,
  type ClientTaskReportGroup,
} from '@/lib/clientTaskReport';
import { filterTasksForReport, validateReportDateRange } from '@/lib/reportFilters';
import {
  buildServiceClientReport,
  filterServiceClientReportGroups,
  type ServiceClientReportGroup,
} from '@/lib/serviceClientReport';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { ReportMultiSelect } from '@/components/ReportMultiSelect';
import { Alert, Button, Card, PageHeader, SectionTitle, Table } from '@/components/ui';
import type { Client, Service, Task } from '@/lib/types';

type ReportType = 'service_client' | 'client_task';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'service_client',
    label: 'Service-wise Client Report',
    description: 'See which clients have received each service in the selected date range.',
  },
  {
    value: 'client_task',
    label: 'Client-wise Task Report',
    description: 'See all tasks grouped by client for the selected date range.',
  },
];

const selectClassName =
  'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('service_client');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generated, setGenerated] = useState(false);
  const [serviceGroups, setServiceGroups] = useState<ServiceClientReportGroup[]>([]);
  const [clientGroups, setClientGroups] = useState<ClientTaskReportGroup[]>([]);

  useEffect(() => {
    async function loadOptions() {
      setOptionsLoading(true);
      try {
        const [clientsRes, servicesRes] = await Promise.all([api.getClients(), api.getServices()]);
        setClients((clientsRes.clients as Client[]) ?? []);
        setServices((servicesRes.services as Service[]) ?? []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load filter options');
      } finally {
        setOptionsLoading(false);
      }
    }
    loadOptions();
  }, []);

  function handleReportTypeChange(nextType: ReportType) {
    setReportType(nextType);
    setGenerated(false);
    setServiceGroups([]);
    setClientGroups([]);
    setError('');
    setSuccess('');
    if (nextType === 'client_task') {
      setSelectedServiceIds([]);
    }
  }

  function clearFilters() {
    setSelectedServiceIds([]);
    setSelectedClientIds([]);
    setFromDate('');
    setToDate('');
    setGenerated(false);
    setServiceGroups([]);
    setClientGroups([]);
    setError('');
    setSuccess('');
  }

  async function handleGenerate() {
    const dateError = validateReportDateRange(fromDate, toDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setGenerated(false);

    try {
      const tasksRes = await api.getTasks();
      const allTasks = ((tasksRes.tasks as Task[]) ?? []).filter((task) => task.isActive);
      const filteredTasks = filterTasksForReport(allTasks, {
        serviceIds:
          reportType === 'service_client' && selectedServiceIds.length > 0
            ? selectedServiceIds
            : undefined,
        clientIds: selectedClientIds.length > 0 ? selectedClientIds : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      if (reportType === 'service_client') {
        let groups = buildServiceClientReport(filteredTasks, clients, services);
        groups = filterServiceClientReportGroups(
          groups,
          {
            serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
            clientIds: selectedClientIds.length > 0 ? selectedClientIds : undefined,
          },
          services
        );

        setServiceGroups(groups);
        setClientGroups([]);
      } else {
        let groups = buildClientTaskReport(filteredTasks, clients);
        groups = filterClientTaskReportGroups(
          groups,
          selectedClientIds.length > 0 ? selectedClientIds : undefined
        );

        if (selectedClientIds.length > 0) {
          const existing = new Set(groups.map((group) => group.clientDbId));
          for (const clientId of selectedClientIds) {
            if (existing.has(clientId)) continue;
            const client = clients.find((item) => item._id === clientId);
            groups.push({
              clientDbId: clientId,
              clientId: client?.clientId || '',
              clientName: client?.name || 'Unknown Client',
              reference: client?.reference || '',
              mobile: client?.mobile || '',
              email: client?.email || '',
              gst: client?.gst || '',
              pan: client?.pan || '',
              tan: client?.tan || '',
              state: client?.state || '',
              tasks: [],
              taskCount: 0,
            });
          }
          groups.sort((a, b) =>
            a.clientName.localeCompare(b.clientName, 'en', { sensitivity: 'base' })
          );
        }

        setClientGroups(groups);
        setServiceGroups([]);
      }

      setGenerated(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate report');
      setServiceGroups([]);
      setClientGroups([]);
    } finally {
      setLoading(false);
    }
  }

  const serviceSummary = useMemo(() => {
    const servicesWithClients = serviceGroups.filter((group) => group.clientCount > 0).length;
    const clientLinks = serviceGroups.reduce((sum, group) => sum + group.clientCount, 0);
    const taskCount = serviceGroups.reduce((sum, group) => sum + group.taskCount, 0);
    return {
      services: serviceGroups.length,
      servicesWithClients,
      clientLinks,
      taskCount,
    };
  }, [serviceGroups]);

  const clientSummary = useMemo(() => {
    const taskCount = clientGroups.reduce((sum, group) => sum + group.taskCount, 0);
    return {
      clients: clientGroups.length,
      taskCount,
    };
  }, [clientGroups]);

  function handleExport() {
    setError('');
    setSuccess('');
    setExporting(true);

    try {
      if (reportType === 'service_client') {
        if (serviceSummary.clientLinks === 0) {
          setError('No client-service records match the selected filters');
          return;
        }
        exportServiceClientReportToExcel(serviceGroups);
        setSuccess(
          `Exported ${serviceSummary.services} service${serviceSummary.services === 1 ? '' : 's'} with ${serviceSummary.clientLinks} client record${serviceSummary.clientLinks === 1 ? '' : 's'} to Excel`
        );
      } else {
        if (clientSummary.taskCount === 0) {
          setError('No tasks match the selected filters');
          return;
        }
        exportClientTaskReportToExcel(clientGroups);
        setSuccess(
          `Exported ${clientSummary.clients} client${clientSummary.clients === 1 ? '' : 's'} with ${clientSummary.taskCount} task${clientSummary.taskCount === 1 ? '' : 's'} to Excel`
        );
      }
    } catch {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  }

  const serviceOptions = useMemo(
    () => services.map((service) => ({ value: service._id, label: service.name })),
    [services]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client._id,
        label: client.clientId ? `${client.clientId} — ${client.name}` : client.name,
      })),
    [clients]
  );

  const activeMeta = REPORT_TYPES.find((item) => item.value === reportType)!;
  const canExport =
    generated &&
    (reportType === 'service_client' ? serviceSummary.clientLinks > 0 : clientSummary.taskCount > 0);

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title="Reports"
          subtitle="Choose a report type, apply filters, generate the report, and export to Excel."
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

        <Card className="mb-6">
          <SectionTitle>Report type</SectionTitle>
          <p className="mt-1 text-sm text-muted">Select what you want to view and export.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {REPORT_TYPES.map((item) => {
              const active = reportType === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleReportTypeChange(item.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? 'border-brand-900 bg-brand-50 ring-2 ring-brand-900/10'
                      : 'border-border bg-white hover:border-brand-300'
                  }`}
                >
                  <p className="font-semibold text-brand-900">{item.label}</p>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SectionTitle>{activeMeta.label}</SectionTitle>
              <p className="text-sm text-muted">{activeMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={clearFilters} disabled={loading || optionsLoading}>
                Clear filters
              </Button>
              <Button onClick={handleGenerate} disabled={loading || optionsLoading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button onClick={handleExport} disabled={!canExport || exporting}>
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {reportType === 'service_client' && (
              <div className="lg:col-span-1">
                <ReportMultiSelect
                  label="Services"
                  options={serviceOptions}
                  selected={selectedServiceIds}
                  onChange={setSelectedServiceIds}
                  disabled={optionsLoading}
                  emptyLabel="All services"
                  searchPlaceholder="Search services..."
                />
              </div>
            )}

            <div className={reportType === 'service_client' ? 'lg:col-span-1' : 'lg:col-span-2'}>
              <ReportMultiSelect
                label="Clients"
                options={clientOptions}
                selected={selectedClientIds}
                onChange={setSelectedClientIds}
                disabled={optionsLoading}
                emptyLabel="All clients"
                searchPlaceholder="Search clients..."
              />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-brand-900">From date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={selectClassName}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-brand-900">To date</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={selectClassName}
              />
            </label>
          </div>

          <p className="mb-6 text-xs text-muted">
            Tasks are included when their start date falls within the selected date range. Leave dates
            empty to include all dates. Leave services/clients unselected to include all.
          </p>

          {!generated ? (
            <p className="py-10 text-center text-sm text-muted">
              Select filters and click Generate Report to view results.
            </p>
          ) : reportType === 'service_client' ? (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Services</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">{serviceSummary.services}</p>
                </div>
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">With clients</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">
                    {serviceSummary.servicesWithClients}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Client records</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">{serviceSummary.clientLinks}</p>
                </div>
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Tasks</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">{serviceSummary.taskCount}</p>
                </div>
              </div>

              {serviceGroups.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">No services found for the selected filters.</p>
              ) : (
                <div className="space-y-6">
                  {serviceGroups.map((group) => (
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
                        <p className="px-4 py-6 text-sm text-muted">
                          No clients received this service in the selected date range.
                        </p>
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
                              <td className="px-4 py-3 font-mono text-sm text-brand-700">
                                {row.clientId || '—'}
                              </td>
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
            </>
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Clients</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">{clientSummary.clients}</p>
                </div>
                <div className="rounded-xl border border-border bg-brand-50/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Tasks</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-900">{clientSummary.taskCount}</p>
                </div>
              </div>

              {clientGroups.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  No tasks found for the selected filters.
                </p>
              ) : (
                <div className="space-y-6">
                  {clientGroups.map((group) => (
                    <div key={group.clientDbId} className="rounded-xl border border-border">
                      <div className="border-b border-border bg-brand-50/60 px-4 py-3">
                        <h3 className="font-semibold text-brand-900">
                          {group.clientId ? `${group.clientId} — ${group.clientName}` : group.clientName}
                        </h3>
                        <p className="text-xs text-muted">
                          {group.taskCount} task{group.taskCount === 1 ? '' : 's'}
                          {group.mobile ? ` · ${group.mobile}` : ''}
                          {group.email ? ` · ${group.email}` : ''}
                        </p>
                      </div>
                      {group.tasks.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted">No tasks for this client.</p>
                      ) : (
                        <Table
                          headers={[
                            'Task',
                            'Service',
                            'Start Date',
                            'Due Date',
                            'Status',
                            'Amount',
                            'Invoiced',
                          ]}
                        >
                          {group.tasks.map((row) => (
                            <tr key={row.taskId} className="hover:bg-brand-50/50">
                              <td className="px-4 py-3 font-medium text-brand-800">{row.taskName}</td>
                              <td className="px-4 py-3">{row.serviceName || '—'}</td>
                              <td className="px-4 py-3">{row.startDate}</td>
                              <td className="px-4 py-3">{row.endDate}</td>
                              <td className="px-4 py-3">
                                <TaskStatusBadge status={row.status} />
                              </td>
                              <td className="px-4 py-3">{row.amount}</td>
                              <td className="px-4 py-3">{row.isInvoiced ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </Table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </CompanyRequired>
  );
}
