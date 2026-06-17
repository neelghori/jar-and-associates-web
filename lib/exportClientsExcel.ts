import * as XLSX from 'xlsx';
import { formatAddress } from '@/lib/formatAddress';
import type { Client } from '@/lib/types';

const HEADERS = [
  'Client ID',
  'Name',
  'Reference',
  'Address',
  'Mobile',
  'Email',
  'GSTIN',
  'PAN',
  'TAN',
  'State',
  'State Code',
  'Place of Supply',
] as const;

function clientRow(client: Client) {
  return [
    client.clientId || '',
    client.name,
    client.reference || '',
    formatAddress(client.address1, client.address2),
    client.mobile || '',
    client.email || '',
    client.gst || '',
    client.pan || '',
    client.tan || '',
    client.state || '',
    client.stateCode || '',
    client.placeOfSupply || '',
  ];
}

function exportFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `clients-${date}.xlsx`;
}

export function exportClientsToExcel(clients: Client[]) {
  const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const rows: (string | number)[][] = [
    ['Total Clients', sorted.length],
    [],
    [...HEADERS],
    ...sorted.map(clientRow),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 18 },
    { wch: 40 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
  XLSX.writeFile(workbook, exportFileName());
}
