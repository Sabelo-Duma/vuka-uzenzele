import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { IconAlert, IconCheck, IconInfo, IconSparkle, IconX } from './icons';

/** C12 Toast / Banner / InlineError — every error surface carries an ERR reference ID. */
export type FeedbackTone = 'success' | 'info' | 'warning' | 'danger' | 'ai';

const toneIcon: Record<FeedbackTone, ReactNode> = {
  success: <IconCheck size={16} />,
  info: <IconInfo size={16} />,
  warning: <IconAlert size={16} />,
  danger: <IconAlert size={16} />,
  ai: <IconSparkle size={16} />,
};

const toneText: Record<FeedbackTone, string> = {
  success: 'text-gj-success',
  info: 'text-gj-info',
  warning: 'text-gj-warning',
  danger: 'text-gj-danger',
  ai: 'text-gj-ai',
};

export interface ToastProps {
  tone: FeedbackTone;
  message: string;
  /** Optional action, e.g. retry. Errors persist until dismissed (UX C12). */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  /** Error reference shown with copy affordance. */
  errorId?: string;
}

export function Toast({ tone, message, actionLabel, onAction, onDismiss, errorId }: ToastProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className="flex w-full max-w-md items-start gap-gj-3 rounded-card bg-gj-bg p-gj-4 shadow-gj-2 border border-gj-border"
    >
      <span className={cx('mt-[2px]', toneText[tone])} aria-hidden="true">{toneIcon[tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-gj-small text-gj-text">{message}</p>
        {errorId && <ErrorRef id={errorId} />}
        {actionLabel && onAction && (
          <div className="mt-gj-2">
            <Button size="sm" variant="default" onClick={onAction}>{actionLabel}</Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification"
          className="text-gj-text-muted hover:text-gj-text rounded-pill p-1">
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

export interface BannerProps {
  tone: FeedbackTone;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** Page-level band under the header; ai tone = "AI assist unavailable — manual mode active". */
export function Banner({ tone, children, onDismiss, className }: BannerProps) {
  const toneBg: Record<FeedbackTone, string> = {
    success: 'bg-gj-success-fill/15 border-gj-success',
    info: 'bg-gj-info/10 border-gj-info',
    warning: 'bg-gj-warning-fill/20 border-gj-warning',
    danger: 'bg-gj-danger-fill/10 border-gj-danger',
    ai: 'bg-gj-ai/10 border-gj-ai',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('flex w-full items-start gap-gj-3 border-l-4 px-gj-4 py-gj-3', toneBg[tone], className)}
    >
      <span className={cx('mt-[2px]', toneText[tone])} aria-hidden="true">{toneIcon[tone]}</span>
      <div className="min-w-0 flex-1 text-gj-small text-gj-text">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss banner"
          className="text-gj-text-muted hover:text-gj-text rounded-pill p-1">
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

/** Inline field error (also embedded in C02). Exposed for custom compositions. */
export function InlineError({ message, id }: { message: string; id?: string }) {
  return (
    <p id={id} role="alert" className="m-0 mt-gj-1 inline-flex items-center gap-gj-1 text-gj-small text-gj-danger">
      <IconAlert size={14} /> {message}
    </p>
  );
}

/** ERR-YYYYMMDD-NNNNN reference with copy-to-clipboard (UX C12). */
export function ErrorRef({ id }: { id: string }) {
  return (
    <span className="mt-gj-1 inline-flex items-center gap-gj-2 font-gj-mono text-gj-mono text-gj-text-muted">
      {id}
      <button
        type="button"
        onClick={() => void navigator.clipboard?.writeText(id)}
        className="rounded-chip border border-gj-border px-2 py-[1px] text-[11px] uppercase hover:bg-gj-bg-hover"
      >
        Copy
      </button>
    </span>
  );
}
