import * as XLSX from 'xlsx';
import { formatAddress } from '@/lib/formatAddress';
import type { ServiceClientReportGroup } from '@/lib/serviceClientReport';

const CLIENT_HEADERS = [
  'Client ID',
  'Client Name',
  'Reference',
  'Mobile',
  'Email',
  'GSTIN',
  'PAN',
  'TAN',
  'Address',
  'State',
  'State Code',
  'Place of Supply',
  'Task Count',
] as const;

const ALL_SERVICES_HEADERS = ['Service Name', 'SAC Code', ...CLIENT_HEADERS] as const;

const CLIENT_COL_WIDTHS = [
  { wch: 12 },
  { wch: 28 },
  { wch: 18 },
  { wch: 16 },
  { wch: 28 },
  { wch: 18 },
  { wch: 14 },
  { wch: 14 },
  { wch: 40 },
  { wch: 16 },
  { wch: 12 },
  { wch: 18 },
  { wch: 12 },
];

const ALL_SERVICES_COL_WIDTHS = [{ wch: 24 }, { wch: 10 }, ...CLIENT_COL_WIDTHS];

function sanitizeSheetName(name: string) {
  const cleaned = name.replace(/[\\/*?:[\]]/g, '').trim();
  return cleaned.slice(0, 31) || 'Service';
}

function uniqueSheetName(base: string, used: Set<string>) {
  let name = sanitizeSheetName(base);
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let index = 2;
  while (used.has(`${name.slice(0, 28)} ${index}`)) index += 1;
  name = `${name.slice(0, 28)} ${index}`;
  used.add(name);
  return name;
}

function clientDataRow(row: ServiceClientReportGroup['clients'][number]) {
  return [
    row.clientId,
    row.clientName,
    row.reference,
    row.mobile,
    row.email,
    row.gst,
    row.pan,
    row.tan,
    formatAddress(row.address1, row.address2),
    row.state,
    row.stateCode,
    row.placeOfSupply,
    row.taskCount,
  ];
}

function allServicesDetailRow(row: ServiceClientReportGroup['clients'][number]) {
  return [row.serviceName, row.sacCode, ...clientDataRow(row)];
}

function buildServiceSheetRows(group: ServiceClientReportGroup): (string | number)[][] {
  return [
    ['Service', group.serviceName],
    ['SAC Code', group.sacCode || ''],
    ['Total Clients', group.clientCount],
    ['Total Tasks', group.taskCount],
    [],
    [...CLIENT_HEADERS],
    ...group.clients.map(clientDataRow),
  ];
}

function exportFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `all-services-client-report-${date}.xlsx`;
}

export function exportServiceClientReportToExcel(groups: ServiceClientReportGroup[]) {
  if (groups.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();
  const totalClients = groups.reduce((sum, group) => sum + group.clientCount, 0);
  const totalTasks = groups.reduce((sum, group) => sum + group.taskCount, 0);

  const summaryRows: (string | number)[][] = [
    ['All Services — Client Report'],
    ['Generated On', new Date().toLocaleString('en-IN')],
    [],
    ['Total Services', groups.length],
    ['Total Clients (across services)', totalClients],
    ['Total Tasks', totalTasks],
    [],
    ['Service Name', 'SAC Code', 'Client Count', 'Task Count'],
    ...groups.map((group) => [group.serviceName, group.sacCode, group.clientCount, group.taskCount]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  usedSheetNames.add('Summary');

  const allDetailRows: (string | number)[][] = [
    [...ALL_SERVICES_HEADERS],
    ...groups.flatMap((group) => group.clients.map(allServicesDetailRow)),
  ];
  const allServicesSheet = XLSX.utils.aoa_to_sheet(allDetailRows);
  allServicesSheet['!cols'] = ALL_SERVICES_COL_WIDTHS;
  XLSX.utils.book_append_sheet(workbook, allServicesSheet, 'All Services');
  usedSheetNames.add('All Services');

  for (const group of groups) {
    if (group.clients.length === 0) continue;
    const sheet = XLSX.utils.aoa_to_sheet(buildServiceSheetRows(group));
    sheet['!cols'] = CLIENT_COL_WIDTHS;
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      uniqueSheetName(group.serviceName, usedSheetNames)
    );
  }

  XLSX.writeFile(workbook, exportFileName());
}
