'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PAGE_SIZE, normalizePageSize } from '@/lib/pagination';

type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type UsePaginatedListOptions<T> = {
  fetchList: (params: Record<string, string>) => Promise<ListResult<T>>;
  pageSize?: number;
  extraParams?: Record<string, string>;
  enabled?: boolean;
};

const EMPTY_PARAMS: Record<string, string> = {};

export function usePaginatedList<T>({
  fetchList,
  pageSize = DEFAULT_PAGE_SIZE,
  extraParams,
  enabled = true,
}: UsePaginatedListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(() => normalizePageSize(pageSize));
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const prevExtraKeyRef = useRef<string | null>(null);

  const extraKey = useMemo(
    () => JSON.stringify(extraParams ?? EMPTY_PARAMS),
    [extraParams]
  );
  const parsedExtraParams = useMemo(
    () => JSON.parse(extraKey) as Record<string, string>,
    [extraKey]
  );

  const limitRef = useRef(limit);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  const setLimit = useCallback((nextLimit: number) => {
    const normalized = normalizePageSize(nextLimit);
    if (normalized === limitRef.current) return;
    limitRef.current = normalized;
    setLimitState(normalized);
    setPage(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchInput.trim();
      setSearch((prev) => {
        if (prev !== nextSearch) setPage(1);
        return prev === nextSearch ? prev : nextSearch;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (prevExtraKeyRef.current !== null && prevExtraKeyRef.current !== extraKey) {
      setPage(1);
    }
    prevExtraKeyRef.current = extraKey;
  }, [extraKey]);

  const load = useCallback(async () => {
    if (!enabled) return;

    const requestId = ++requestIdRef.current;
    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        ...parsedExtraParams,
      };
      if (search.trim()) params.search = search.trim();

      const result = await fetchList(params);
      if (requestId !== requestIdRef.current) return;

      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      if (!hasLoadedRef.current) {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      }
    } finally {
      if (requestId !== requestIdRef.current) return;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [enabled, page, limit, search, extraKey, fetchList, parsedExtraParams]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    search: searchInput,
    setSearch: setSearchInput,
    page,
    setPage,
    total,
    totalPages,
    limit,
    setLimit,
    loading: initialLoading,
    refreshing,
    reload: load,
  };
}
