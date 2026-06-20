import { formatDisplayDate } from '@/lib/dates';
import { taskStatusLabel } from '@/lib/taskStatus';
import type { Client, Task } from '@/lib/types';

export type ClientTaskReportRow = {
  taskId: string;
  taskName: string;
  serviceName: string;
  sacCode: string;
  startDate: string;
  endDate: string;
  status: string;
  statusLabel: string;
  amount: number;
  isInvoiced: boolean;
};

export type ClientTaskReportGroup = {
  clientDbId: string;
  clientId: string;
  clientName: string;
  reference: string;
  mobile: string;
  email: string;
  gst: string;
  pan: string;
  tan: string;
  state: string;
  tasks: ClientTaskReportRow[];
  taskCount: number;
};

function refId(value: string | { _id: string }): string {
  return typeof value === 'object' ? value._id : value;
}

function refName(value: string | { _id: string; name: string }): string {
  return typeof value === 'object' ? value.name : '';
}

function emptyClientFields(client?: Client) {
  return {
    clientId: client?.clientId || '',
    clientName: client?.name || '',
    reference: client?.reference || '',
    mobile: client?.mobile || '',
    email: client?.email || '',
    gst: client?.gst || '',
    pan: client?.pan || '',
    tan: client?.tan || '',
    state: client?.state || '',
  };
}

function taskToRow(task: Task): ClientTaskReportRow {
  const service = task.service;
  return {
    taskId: task._id,
    taskName: task.taskName,
    serviceName: refName(service),
    sacCode: typeof service === 'object' ? service.sacCode || '' : '',
    startDate: formatDisplayDate(task.startDate),
    endDate: formatDisplayDate(task.endDate),
    status: task.status,
    statusLabel: taskStatusLabel(task.status),
    amount: task.amount ?? 0,
    isInvoiced: Boolean(task.isInvoiced),
  };
}

export function buildClientTaskReport(tasks: Task[], clients: Client[]): ClientTaskReportGroup[] {
  const clientMap = new Map(clients.map((client) => [client._id, client]));
  const byClient = new Map<string, Task[]>();

  for (const task of tasks) {
    if (!task.isActive) continue;
    const clientDbId = refId(task.client);
    if (!byClient.has(clientDbId)) byClient.set(clientDbId, []);
    byClient.get(clientDbId)!.push(task);
  }

  return [...byClient.entries()]
    .map(([clientDbId, clientTasks]) => {
      const client = clientMap.get(clientDbId);
      const fields = emptyClientFields(client);
      const rows = clientTasks
        .map(taskToRow)
        .sort((a, b) => a.taskName.localeCompare(b.taskName, 'en', { sensitivity: 'base' }));
      return {
        clientDbId,
        ...fields,
        tasks: rows,
        taskCount: rows.length,
      };
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName, 'en', { sensitivity: 'base' }));
}

export function filterClientTaskReportGroups(
  groups: ClientTaskReportGroup[],
  clientIds?: string[]
): ClientTaskReportGroup[] {
  const ids = clientIds?.filter(Boolean) ?? [];
  if (ids.length === 0) return groups;
  return groups.filter((group) => ids.includes(group.clientDbId));
}
