export const TASK_STATUSES = ['todo', 'inprogress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  inprogress: 'In progress',
  completed: 'Completed',
};

export const TASK_STATUS_STYLES: Record<
  TaskStatus,
  { badge: string; active: string; inactive: string }
> = {
  todo: {
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    active: 'bg-slate-700 text-white border-slate-700 shadow-sm',
    inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  },
  inprogress: {
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    inactive: 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50',
  },
  completed: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    inactive: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
};

/** Map legacy DB values to current status values. */
export function normalizeTaskStatus(status: string): TaskStatus {
  if (status === 'pending') return 'todo';
  if (status === 'in_progress') return 'inprogress';
  if (status === 'invoiced') return 'completed';
  if (TASK_STATUSES.includes(status as TaskStatus)) return status as TaskStatus;
  return 'todo';
}

export function taskStatusLabel(status: string): string {
  return LABELS[normalizeTaskStatus(status)] ?? status;
}
