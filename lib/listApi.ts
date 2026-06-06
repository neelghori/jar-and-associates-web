import { DEFAULT_PAGE_SIZE, type PaginationMeta } from '@/lib/pagination';

export function mapPaginatedList<T>(key: string, res: Record<string, unknown>) {
  const items = (res[key] as T[]) ?? [];
  const meta: PaginationMeta = {
    total: typeof res.total === 'number' ? res.total : items.length,
    page: typeof res.page === 'number' ? res.page : 1,
    limit: typeof res.limit === 'number' ? res.limit : DEFAULT_PAGE_SIZE,
    totalPages: typeof res.totalPages === 'number' ? res.totalPages : 1,
  };
  return { items, ...meta };
}
