'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { PAGE_SIZE_OPTIONS, paginationLabel } from '@/lib/pagination';

type PaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  disabled?: boolean;
};

export function Pagination({
  page,
  totalPages,
  total = 0,
  limit,
  onPageChange,
  onLimitChange,
  disabled,
}: PaginationProps) {
  if (total === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const rangeLabel = limit ? paginationLabel(page, limit, total) : `Page ${page} of ${safeTotalPages}`;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted">{rangeLabel}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {onLimitChange && limit ? (
          <label className="flex items-center gap-2 text-xs text-muted">
            <span>Show</span>
            <select
              value={limit}
              disabled={disabled}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm font-medium text-brand-800 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium text-brand-800">
            {page} / {safeTotalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3"
            disabled={disabled || page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
