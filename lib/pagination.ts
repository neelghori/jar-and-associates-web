export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function normalizePageSize(value: number): PageSize {
  return isPageSize(value) ? value : DEFAULT_PAGE_SIZE;
}

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedListResponse<K extends string, T> = {
  [key in K]: T[];
} & Partial<PaginationMeta>;

export function paginationRange(page: number, limit: number, total: number) {
  if (total === 0) return { start: 0, end: 0 };
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return { start, end };
}

export function paginationLabel(page: number, limit: number, total: number) {
  const { start, end } = paginationRange(page, limit, total);
  if (total === 0) return 'No records';
  return `Showing ${start}–${end} of ${total}`;
}
