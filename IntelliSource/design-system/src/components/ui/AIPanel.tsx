import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { IconRefresh, IconSparkle, IconX } from './icons';

/** C04 AIBadge & AIPanel — AI output is always visually distinct + human-confirmed. */
export type AiConfidence = 'High' | 'Medium' | 'Low';

export function AIBadge({ label = 'AI-drafted — review required' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-gj-1 rounded-chip border border-gj-ai px-3 py-[3px] text-gj-btn uppercase text-gj-ai">
      <IconSparkle size={12} /> {label}
    </span>
  );
}

export function ConfidenceChip({ level }: { level: AiConfidence }) {
  const dot = level === 'High' ? '●' : level === 'Medium' ? '◐' : '○';
  return (
    <span className="inline-flex items-center gap-gj-1 rounded-chip border border-gj-ai/60 px-2 py-[2px] text-[11px] font-semibold text-gj-ai">
      <span aria-hidden="true">{dot}</span> {level} confidence
    </span>
  );
}

export interface AIPanelProps {
  /** Panel heading, e.g. "Scope of work". */
  title: string;
  badgeLabel?: string;
  confidence?: AiConfidence;
  /** Streaming/generation in progress. */
  isLoading?: boolean;
  /** AI failure → inline fallback, never blocks (UX §5a). */
  error?: string | null;
  /** Confirmed by human → dashed AI treatment cleared. */
  confirmed?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
  onDiscard?: () => void;
  onRegenerate?: () => void;
  onManualFallback?: () => void;
  children?: ReactNode;
  className?: string;
}

export function AIPanel({
  title, badgeLabel, confidence, isLoading, error, confirmed,
  onConfirm, onEdit, onDiscard, onRegenerate, onManualFallback,
  children, className,
}: AIPanelProps) {
  return (
    <section
      aria-label={`${title} (AI-generated)`}
      className={cx(
        'rounded-card p-gj-6 bg-gj-bg',
        confirmed ? 'border border-gj-border' : 'border-[1.5px] border-dashed border-gj-ai',
        className,
      )}
    >
      <header className="mb-gj-4 flex flex-wrap items-center justify-between gap-gj-2">
        <div className="flex flex-wrap items-center gap-gj-2">
          <h4 className="text-gj-h4 text-gj-navy m-0">{title}</h4>
          {!confirmed && <AIBadge label={badgeLabel} />}
          {confidence && !confirmed && <ConfidenceChip level={confidence} />}
        </div>
        <div className="flex items-center gap-gj-1">
          {onRegenerate && !isLoading && (
            <button type="button" onClick={onRegenerate} aria-label="Regenerate with AI"
              className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-gj-text-muted hover:bg-gj-bg-hover">
              <IconRefresh size={14} />
            </button>
          )}
          {onDiscard && !isLoading && (
            <button type="button" onClick={onDiscard} aria-label="Discard AI draft"
              className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-gj-text-muted hover:bg-gj-bg-hover">
              <IconX size={14} />
            </button>
          )}
        </div>
      </header>

      {isLoading && (
        <div aria-live="polite" aria-busy="true" className="space-y-gj-2">
          <p className="m-0 text-gj-small text-gj-text-muted">Generating…</p>
          <div className="h-3 w-full rounded-chip bg-gj-bg-hover animate-gj-pulse-soft" />
          <div className="h-3 w-4/5 rounded-chip bg-gj-bg-hover animate-gj-pulse-soft" />
          <div className="h-3 w-3/5 rounded-chip bg-gj-bg-hover animate-gj-pulse-soft" />
        </div>
      )}

      {!isLoading && error && (
        <div role="status" className="rounded-card bg-gj-bg-light p-gj-4">
          <p className="m-0 mb-gj-2 text-gj-small text-gj-text">{error}</p>
          <div className="flex gap-gj-2">
            {onRegenerate && <Button size="sm" variant="default" onClick={onRegenerate}>Retry</Button>}
            {onManualFallback && <Button size="sm" variant="ghost" onClick={onManualFallback}>Continue manually</Button>}
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div aria-live="polite" className="text-gj-base text-gj-text [&_p]:text-gj-text-muted">{children}</div>
      )}

      {!isLoading && !error && !confirmed && (onConfirm || onEdit || onDiscard) && (
        <footer className="mt-gj-4 flex gap-gj-2 border-t border-gj-border pt-gj-4">
          {onConfirm && <Button variant="primary" size="sm" onClick={onConfirm}>Confirm</Button>}
          {onEdit && <Button variant="default" size="sm" onClick={onEdit}>Edit</Button>}
          {onDiscard && <Button variant="ghost" size="sm" onClick={onDiscard}>Discard</Button>}
        </footer>
      )}
    </section>
  );
}
