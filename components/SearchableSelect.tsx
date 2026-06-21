'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
};

function filterOptions(options: SearchableSelectOption[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return options;
  const compactTerm = term.replace(/[\s—-]/g, '');
  return options.filter((option) => {
    const haystack = `${option.label} ${option.keywords || ''}`.toLowerCase();
    const compactHaystack = haystack.replace(/[\s—-]/g, '');
    return haystack.includes(term) || compactHaystack.includes(compactTerm);
  });
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No matches found',
  required,
  disabled,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => filterOptions(options, query), [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function handleFocus() {
    if (disabled) return;
    setOpen(true);
    if (selected) setQuery(selected.label);
    else setQuery('');
  }

  function handleChange(nextQuery: string) {
    setQuery(nextQuery);
    setOpen(true);
    if (value) onChange('');
  }

  const displayValue = open ? query : selected?.label || '';

  return (
    <div ref={rootRef} className="relative block">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-brand-900">{label}</span>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            value={displayValue}
            placeholder={searchPlaceholder}
            disabled={disabled}
            required={required && !value}
            onFocus={handleFocus}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-3 pl-3 pr-10 text-sm text-brand-900 outline-none transition focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </label>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">{emptyMessage}</li>
          ) : (
            filtered.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 ${
                      active ? 'bg-brand-50 font-medium text-brand-900' : 'text-brand-800'
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      {!value && !open && (
        <p className="mt-1.5 text-xs text-muted">{placeholder}</p>
      )}
    </div>
  );
}
