'use client';

import type { ReactNode } from 'react';
import { Modal } from '@/components/Modal';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Button } from '@/components/ui';
import { formatDisplayDate } from '@/lib/dates';
import { taskStatusLabel } from '@/lib/taskStatus';
import type { Task } from '@/lib/types';

type TaskViewModalProps = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  overdue?: boolean;
};

function getUploadBaseUrl() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return api.replace(/\/api\/?$/, '');
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-brand-800">{value}</dd>
    </div>
  );
}

export function TaskViewModal({ task, open, onClose, onEdit, overdue }: TaskViewModalProps) {
  if (!task) return null;

  const clientName = typeof task.client === 'object' ? task.client.name : '—';
  const serviceName = typeof task.service === 'object' ? task.service.name : '—';

  return (
    <Modal open={open} onClose={onClose} title="Task details" description={task.taskName} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {overdue && (
            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Overdue
            </span>
          )}
          {task.isInvoiced && (
            <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              Invoiced
            </span>
          )}
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Client" value={clientName} />
          <Detail label="Service" value={serviceName} />
          <Detail label="Start date" value={formatDisplayDate(task.startDate)} />
          <Detail label="Due date" value={formatDisplayDate(task.endDate)} />
          <Detail label="Status" value={taskStatusLabel(task.status)} />
          <Detail
            label="Attachment"
            value={
              task.attachment ? (
                <a
                  href={`${getUploadBaseUrl()}${task.attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline"
                >
                  View file
                </a>
              ) : (
                '—'
              )
            }
          />
        </dl>

        {task.description && (
          <div className="rounded-xl border border-border bg-brand-50/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-800">{task.description}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button type="button" className="flex-1" onClick={onEdit}>
              Edit task
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
