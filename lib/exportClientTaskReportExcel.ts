import * as XLSX from 'xlsx';
import type { ClientTaskReportGroup } from '@/lib/clientTaskReport';

const TASK_HEADERS = [
  'Task Name',
  'Service',
  'SAC Code',
  'Start Date',
  'End Date',
  'Status',
  'Amount',
  'Invoiced',
] as const;

const ALL_CLIENTS_HEADERS = ['Client ID', 'Client Name', ...TASK_HEADERS] as const;

function taskDataRow(row: ClientTaskReportGroup['tasks'][number]) {
  return [
    row.taskName,
    row.serviceName,
    row.sacCode,
    row.startDate,
    row.endDate,
    row.statusLabel,
    row.amount,
    row.isInvoiced ? 'Yes' : 'No',
  ];
}

function allClientsDetailRow(
  group: ClientTaskReportGroup,
  row: ClientTaskReportGroup['tasks'][number]
) {
  return [group.clientId, group.clientName, ...taskDataRow(row)];
}

function sanitizeSheetName(name: string) {
  const cleaned = name.replace(/[\\/*?:[\]]/g, '').trim();
  return cleaned.slice(0, 31) || 'Client';
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

function exportFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `client-wise-task-report-${date}.xlsx`;
}

export function exportClientTaskReportToExcel(groups: ClientTaskReportGroup[]) {
  if (groups.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();
  const totalTasks = groups.reduce((sum, group) => sum + group.taskCount, 0);

  const summaryRows: (string | number)[][] = [
    ['Client-wise Task Report'],
    ['Generated On', new Date().toLocaleString('en-IN')],
    [],
    ['Total Clients', groups.length],
    ['Total Tasks', totalTasks],
    [],
    ['Client ID', 'Client Name', 'Task Count'],
    ...groups.map((group) => [group.clientId, group.clientName, group.taskCount]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  usedSheetNames.add('Summary');

  const allDetailRows: (string | number)[][] = [
    [...ALL_CLIENTS_HEADERS],
    ...groups.flatMap((group) => group.tasks.map((row) => allClientsDetailRow(group, row))),
  ];
  const allSheet = XLSX.utils.aoa_to_sheet(allDetailRows);
  allSheet['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 28 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, allSheet, 'All Tasks');
  usedSheetNames.add('All Tasks');

  for (const group of groups) {
    if (group.tasks.length === 0) continue;
    const sheetRows: (string | number)[][] = [
      ['Client ID', group.clientId],
      ['Client Name', group.clientName],
      ['Total Tasks', group.taskCount],
      [],
      [...TASK_HEADERS],
      ...group.tasks.map(taskDataRow),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      uniqueSheetName(group.clientName, usedSheetNames)
    );
  }

  XLSX.writeFile(workbook, exportFileName());
}
