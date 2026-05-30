'use client';

import { TASK_STATUS_STYLES, normalizeTaskStatus, taskStatusLabel } from '@/lib/taskStatus';

export function TaskStatusBadge({ status }: { status: string }) {
  const normalized = normalizeTaskStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TASK_STATUS_STYLES[normalized].badge}`}
    >
      {taskStatusLabel(status)}
    </span>
  );
}
