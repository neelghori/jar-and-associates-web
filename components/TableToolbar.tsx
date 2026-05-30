'use client';

import { Search } from 'lucide-react';
import { ReactNode } from 'react';

type TableToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  total: number;
  filtered: number;
  action?: ReactNode;
};

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  total,
  filtered,
  action,
}: TableToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-xs text-muted whitespace-nowrap">
          {filtered === total ? `${total} records` : `${filtered} of ${total} records`}
        </p>
        {action}
      </div>
    </div>
  );
}

export function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}
