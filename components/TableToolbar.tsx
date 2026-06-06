'use client';

import { Search } from 'lucide-react';
import { ReactNode } from 'react';
import { paginationLabel } from '@/lib/pagination';

type TableToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  total: number;
  filtered?: number;
  page?: number;
  limit?: number;
  loading?: boolean;
  refreshing?: boolean;
  action?: ReactNode;
  filters?: ReactNode;
};

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  total,
  filtered,
  page,
  limit,
  loading,
  refreshing,
  action,
  filters,
}: TableToolbarProps) {
  const countLabel =
    page && limit
      ? paginationLabel(page, limit, total)
      : filtered !== undefined && filtered !== total
        ? `${filtered} of ${total} records`
        : `${total} records`;

  const statusLabel = loading ? 'Loading…' : countLabel;

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-border bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
          />
        </div>
        {filters}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3">
        <p
          className={`text-xs whitespace-nowrap transition-opacity ${refreshing ? 'text-muted/70' : 'text-muted'}`}
        >
          {statusLabel}
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
