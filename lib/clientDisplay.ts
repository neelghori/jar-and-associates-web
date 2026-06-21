import type { Client } from '@/lib/types';

export function formatClientLabel(client: Pick<Client, 'clientId' | 'name'>) {
  return client.clientId ? `${client.clientId} — ${client.name}` : client.name;
}

export function clientSearchKeywords(client: Client) {
  return [
    client.clientId,
    client.name,
    client.reference,
    client.mobile,
    client.email,
    client.gst,
    client.pan,
    client.tan,
  ]
    .filter(Boolean)
    .join(' ');
}

export function clientMatchesSearch(client: Client, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const compactTerm = term.replace(/[\s—-]/g, '');
  const haystack = clientSearchKeywords(client).toLowerCase();
  const compactHaystack = haystack.replace(/[\s—-]/g, '');
  return haystack.includes(term) || compactHaystack.includes(compactTerm);
}

export function clientSelectOptions(clients: Client[]) {
  return clients.map((client) => ({
    value: client._id,
    label: formatClientLabel(client),
    keywords: clientSearchKeywords(client),
  }));
}
