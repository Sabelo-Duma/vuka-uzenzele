import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { IconInbox } from './icons';

/** C13 EmptyState — icon + title + description (≤2 lines) + primary CTA. */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Secondary action, e.g. "Start from an intake". */
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-gj-6 py-gj-9 text-center', className)}>
      <span className="mb-gj-4 text-gj-navy" aria-hidden="true">
        {icon ?? <IconInbox size={48} />}
      </span>
      <h4 className="m-0 mb-gj-2 text-gj-h4 text-gj-navy">{title}</h4>
      {description && (
        <p className="m-0 mb-gj-5 max-w-md text-gj-base text-gj-text-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-gj-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
