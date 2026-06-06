export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TaskType = 'one_time' | 'recurring';

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function recurrenceLabel(frequency: RecurrenceFrequency | string): string {
  return RECURRENCE_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
}
