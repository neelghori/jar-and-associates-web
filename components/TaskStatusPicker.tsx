'use client';

import {
  TASK_STATUSES,
  TASK_STATUS_STYLES,
  normalizeTaskStatus,
  taskStatusLabel,
  type TaskStatus,
} from '@/lib/taskStatus';

type TaskStatusPickerProps = {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
};

export function TaskStatusPicker({ value, onChange, disabled, compact, hideLabel }: TaskStatusPickerProps) {
  const current = normalizeTaskStatus(value);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!hideLabel && <p className="text-xs font-medium text-muted">Mark status</p>}
      <div className="inline-flex flex-wrap gap-2 rounded-xl border border-border bg-brand-50/80 p-1.5">
        {TASK_STATUSES.map((status) => {
          const active = current === status;
          const styles = TASK_STATUS_STYLES[status];
          return (
            <button
              key={status}
              type="button"
              disabled={disabled}
              onClick={() => onChange(status)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? styles.active : styles.inactive
              }`}
            >
              {taskStatusLabel(status)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
