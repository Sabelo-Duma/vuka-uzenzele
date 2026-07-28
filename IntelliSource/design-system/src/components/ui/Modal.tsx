import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cx } from '../../utils/cx';
import { FocusTrap } from '../../utils/a11y/FocusTrap';
import { useFocusReturn } from '../../utils/a11y/useFocusReturn';
import { IconX } from './icons';

/** C14 Modal / Drawer — focus-trapped, Esc closes (unless destructive confirm), focus returns to trigger. */
export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** 'confirm' = 560px, 'form' = 800px. */
  size?: 'confirm' | 'form';
  /** Destructive confirms disable Esc/backdrop close (explicit choice required). */
  destructive?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, size = 'confirm', destructive = false, children, footer }: ModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useFocusReturn(open);

  useEffect(() => {
    if (!open || destructive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, destructive, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-gj-4"
      role="presentation"
      onMouseDown={(e) => {
        if (!destructive && e.target === e.currentTarget) onClose();
      }}
      style={{ background: 'rgba(13, 24, 43, 0.55)' }}
    >
      <FocusTrap active initialFocusRef={titleRef}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gj-modal-title"
          className={cx(
            'w-full rounded-card bg-gj-bg shadow-gj-3 outline-none',
            size === 'confirm' ? 'max-w-[560px]' : 'max-w-[800px]',
          )}
        >
          <header className="flex items-start justify-between gap-gj-4 border-b border-gj-border p-gj-6 pb-gj-4">
            <h4 id="gj-modal-title" ref={titleRef} tabIndex={-1} className="m-0 text-gj-h4 text-gj-navy outline-none">
              {title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-pill p-1 text-gj-text-muted hover:bg-gj-bg-hover hover:text-gj-text"
            >
              <IconX size={16} />
            </button>
          </header>
          <div className="p-gj-6 text-gj-base text-gj-text">{children}</div>
          {footer && <footer className="flex justify-end gap-gj-3 border-t border-gj-border p-gj-6 pt-gj-4">{footer}</footer>}
        </div>
      </FocusTrap>
    </div>
  );
}

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Right-hand drawer (480px) for detail peeks: audit entries, citations, supplier profiles. */
export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useFocusReturn(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ background: 'rgba(13, 24, 43, 0.55)' }}
    >
      <FocusTrap active initialFocusRef={titleRef}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="gj-drawer-title"
          className="absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto bg-gj-bg shadow-gj-3 transition-transform duration-gj-panel ease-gj"
        >
          <header className="sticky top-0 flex items-start justify-between gap-gj-4 border-b border-gj-border bg-gj-bg p-gj-6 pb-gj-4">
            <h4 id="gj-drawer-title" ref={titleRef} tabIndex={-1} className="m-0 text-gj-h4 text-gj-navy outline-none">
              {title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="rounded-pill p-1 text-gj-text-muted hover:bg-gj-bg-hover hover:text-gj-text"
            >
              <IconX size={16} />
            </button>
          </header>
          <div className="p-gj-6 text-gj-base text-gj-text">{children}</div>
        </aside>
      </FocusTrap>
    </div>
  );
}
