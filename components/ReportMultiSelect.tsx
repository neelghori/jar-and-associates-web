'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type ReportMultiSelectOption = {
  value: string;
  label: string;
};

type ReportMultiSelectProps = {
  label: string;
  options: ReportMultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  emptyLabel?: string;
  searchPlaceholder?: string;
};

export function ReportMultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
  emptyLabel = 'All',
  searchPlaceholder = 'Search...',
}: ReportMultiSelectProps) {
  const [search, setSearch] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, search]);

  function toggle(value: string) {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  }

  function selectAllVisible() {
    const next = new Set(selectedSet);
    for (const option of filteredOptions) next.add(option.value);
    onChange([...next]);
  }

  function clearAll() {
    onChange([]);
  }

  const summary =
    selected.length === 0
      ? `${emptyLabel} (none selected)`
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label || '1 selected'
        : `${selected.length} selected`;

  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-brand-900">{label}</span>
        <span className="text-xs text-muted">{summary}</span>
      </div>
      <div className="rounded-lg border border-border bg-white">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              disabled={disabled}
              className="h-9 w-full rounded-md border border-border bg-white py-1.5 pl-8 pr-2 text-sm outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 disabled:opacity-60"
            />
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            <button
              type="button"
              disabled={disabled || filteredOptions.length === 0}
              onClick={selectAllVisible}
              className="font-medium text-brand-800 hover:text-brand-900 disabled:opacity-50"
            >
              Select visible
            </button>
            <button
              type="button"
              disabled={disabled || selected.length === 0}
              onClick={clearAll}
              className="font-medium text-muted hover:text-brand-800 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto p-2">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">No options available.</p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">No matches.</p>
          ) : (
            <ul className="space-y-0.5">
              {filteredOptions.map((option) => {
                const checked = selectedSet.has(option.value);
                return (
                  <li key={option.value}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-brand-50/80 ${
                        disabled ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(option.value)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-brand-900 focus:ring-brand-900/20"
                      />
                      <span className="min-w-0 flex-1 text-brand-800">{option.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Leave none selected to include all. Select one or more to filter.
      </p>
    </div>
  );
}
