import { toDateInputValue } from '@/lib/dates';
import type { Task } from '@/lib/types';

function refId(value: string | { _id: string }): string {
  return typeof value === 'object' ? value._id : value;
}

export type ReportTaskFilters = {
  serviceIds?: string[];
  clientIds?: string[];
  fromDate?: string;
  toDate?: string;
};

function matchesIds(id: string, selectedIds?: string[]): boolean {
  if (!selectedIds || selectedIds.length === 0) return true;
  return selectedIds.includes(id);
}

export function filterTasksForReport(tasks: Task[], filters: ReportTaskFilters): Task[] {
  return tasks.filter((task) => {
    if (!task.isActive) return false;
    if (!matchesIds(refId(task.service), filters.serviceIds)) return false;
    if (!matchesIds(refId(task.client), filters.clientIds)) return false;
    const startKey = toDateInputValue(task.startDate);
    if (!startKey) return false;
    if (filters.fromDate && startKey < filters.fromDate) return false;
    if (filters.toDate && startKey > filters.toDate) return false;
    return true;
  });
}

export function validateReportDateRange(fromDate: string, toDate: string): string | null {
  if (fromDate && toDate && fromDate > toDate) {
    return 'From date cannot be after To date';
  }
  return null;
}
