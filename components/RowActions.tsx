'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';

type RowActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

const btn =
  'inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition hover:bg-brand-50';

export function RowActions({ onView, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex flex-nowrap items-center gap-1">
      {onView && (
        <button type="button" className={`${btn} text-brand-700`} onClick={onView} title="View details">
          <Eye className="h-4 w-4 shrink-0" />
          <span>View</span>
        </button>
      )}
      {onEdit && (
        <button type="button" className={`${btn} text-brand-700`} onClick={onEdit} title="Edit">
          <Pencil className="h-4 w-4 shrink-0" />
          <span>Edit</span>
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className={`${btn} text-red-600 hover:bg-red-50`}
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          <span>Delete</span>
        </button>
      )}
    </div>
  );
}
