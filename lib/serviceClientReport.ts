import type { Client, Service, Task } from '@/lib/types';

export type ServiceClientReportRow = {
  serviceId: string;
  serviceName: string;
  sacCode: string;
  clientDbId: string;
  clientId: string;
  clientName: string;
  reference: string;
  mobile: string;
  email: string;
  gst: string;
  pan: string;
  tan: string;
  address1: string;
  address2: string;
  state: string;
  stateCode: string;
  placeOfSupply: string;
  taskCount: number;
};

export type ServiceClientReportGroup = {
  serviceId: string;
  serviceName: string;
  sacCode: string;
  clients: ServiceClientReportRow[];
  clientCount: number;
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
    address1: client?.address1 || '',
    address2: client?.address2 || '',
    state: client?.state || '',
    stateCode: client?.stateCode || '',
    placeOfSupply: client?.placeOfSupply || '',
  };
}

export function buildServiceClientReport(
  tasks: Task[],
  clients: Client[],
  services: Service[]
): ServiceClientReportGroup[] {
  const clientMap = new Map(clients.map((client) => [client._id, client]));
  const serviceCounts = new Map<string, Map<string, number>>();

  for (const task of tasks) {
    if (!task.isActive) continue;
    const serviceId = refId(task.service);
    const clientDbId = refId(task.client);
    if (!serviceCounts.has(serviceId)) serviceCounts.set(serviceId, new Map());
    const byClient = serviceCounts.get(serviceId)!;
    byClient.set(clientDbId, (byClient.get(clientDbId) || 0) + 1);
  }

  const serviceMeta = new Map(
    services.map((service) => [service._id, { name: service.name, sacCode: service.sacCode || '' }])
  );

  for (const task of tasks) {
    if (!task.isActive) continue;
    const serviceId = refId(task.service);
    if (!serviceMeta.has(serviceId)) {
      serviceMeta.set(serviceId, {
        name: refName(task.service),
        sacCode: typeof task.service === 'object' ? task.service.sacCode || '' : '',
      });
    }
  }

  const serviceIds = [...new Set([...serviceMeta.keys(), ...serviceCounts.keys()])];

  return serviceIds
    .map((serviceId) => {
      const meta = serviceMeta.get(serviceId) || { name: 'Unknown Service', sacCode: '' };
      const byClient = serviceCounts.get(serviceId) || new Map<string, number>();
      const rows: ServiceClientReportRow[] = [...byClient.entries()]
        .map(([clientDbId, taskCount]) => {
          const client = clientMap.get(clientDbId);
          const fields = emptyClientFields(client);
          return {
            serviceId,
            serviceName: meta.name,
            sacCode: meta.sacCode,
            clientDbId,
            taskCount,
            ...fields,
          };
        })
        .sort((a, b) => a.clientName.localeCompare(b.clientName, 'en', { sensitivity: 'base' }));

      const taskCount = rows.reduce((sum, row) => sum + row.taskCount, 0);
      return {
        serviceId,
        serviceName: meta.name,
        sacCode: meta.sacCode,
        clients: rows,
        clientCount: rows.length,
        taskCount,
      };
    })
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName, 'en', { sensitivity: 'base' }));
}

export function flattenServiceClientReport(groups: ServiceClientReportGroup[]): ServiceClientReportRow[] {
  return groups.flatMap((group) => group.clients);
}

export function filterServiceClientReportGroups(
  groups: ServiceClientReportGroup[],
  options: { serviceIds?: string[]; clientIds?: string[] },
  services: { _id: string; name: string; sacCode?: string }[] = []
): ServiceClientReportGroup[] {
  const serviceIds = options.serviceIds?.filter(Boolean) ?? [];
  const clientIds = options.clientIds?.filter(Boolean) ?? [];

  let result = groups;

  if (serviceIds.length > 0) {
    result = result.filter((group) => serviceIds.includes(group.serviceId));
  }

  result = result
    .map((group) => {
      const clients =
        clientIds.length > 0
          ? group.clients.filter((row) => clientIds.includes(row.clientDbId))
          : group.clients;
      const taskCount = clients.reduce((sum, row) => sum + row.taskCount, 0);
      return {
        ...group,
        clients,
        clientCount: clients.length,
        taskCount,
      };
    })
    .filter((group) => serviceIds.length > 0 || group.clientCount > 0);

  if (serviceIds.length > 0) {
    const existing = new Set(result.map((group) => group.serviceId));
    for (const serviceId of serviceIds) {
      if (existing.has(serviceId)) continue;
      const service = services.find((item) => item._id === serviceId);
      result.push({
        serviceId,
        serviceName: service?.name || 'Unknown Service',
        sacCode: service?.sacCode || '',
        clients: [],
        clientCount: 0,
        taskCount: 0,
      });
    }
    result.sort((a, b) => a.serviceName.localeCompare(b.serviceName, 'en', { sensitivity: 'base' }));
  }

  return result;
}
