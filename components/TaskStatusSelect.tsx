'use client';

import {
  TASK_STATUSES,
  TASK_STATUS_STYLES,
  normalizeTaskStatus,
  taskStatusLabel,
  type TaskStatus,
} from '@/lib/taskStatus';

type TaskStatusSelectProps = {
  value: TaskStatus | string;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
};

export function TaskStatusSelect({ value, onChange, disabled }: TaskStatusSelectProps) {
  const current = normalizeTaskStatus(String(value));
  const styles = TASK_STATUS_STYLES[current];

  return (
    <select
      value={current}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={`w-full min-w-[9.5rem] max-w-[11rem] cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 ${styles.badge}`}
      aria-label="Task status"
    >
      {TASK_STATUSES.map((status) => (
        <option key={status} value={status}>
          {taskStatusLabel(status)}
        </option>
      ))}
    </select>
  );
}
