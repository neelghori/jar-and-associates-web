'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

const widths = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close dialog"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative z-10 flex w-full ${widths[size]} max-h-[min(90vh,calc(100dvh-2rem))] flex-col rounded-xl border border-border bg-surface shadow-[0_24px_64px_rgba(10,10,10,0.12)]`}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0 pr-2">
              <h2 id="modal-title" className="text-lg font-semibold text-brand-800">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
