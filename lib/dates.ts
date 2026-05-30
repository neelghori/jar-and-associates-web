/** Calendar date in the user's local timezone (ignores time-of-day). */
export function toLocalDateOnly(value: string | Date | undefined | null): Date | null {
  if (value == null || value === '') return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfToday(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/** True when the due/end calendar date is strictly before today (local). */
export function isDateBeforeToday(value: string | Date | undefined | null): boolean {
  const end = toLocalDateOnly(value);
  if (!end) return false;
  return end < startOfToday();
}

export function formatDisplayDate(value: string | Date | undefined | null): string {
  const d = toLocalDateOnly(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toDateInputValue(value: string | Date | undefined | null): string {
  const d = toLocalDateOnly(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
