import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { IconLock, IconLockOpen } from './icons';

/** C09 EnvelopeCard — Technical/Commercial envelopes; sealed shows blurred CSS placeholders (never real data). */
export interface EnvelopeCardProps {
  envelope: 'Technical' | 'Commercial';
  sealed: boolean;
  /** e.g. "Opens automatically at close" / "Requires technical gate + audited action". */
  sealedCaption?: string;
  /** Unseal affordance (Commercial only; opens confirm modal upstream). */
  onRequestOpen?: () => void;
  openDisabledReason?: string;
  children?: ReactNode;
  className?: string;
}

export function EnvelopeCard({
  envelope, sealed, sealedCaption, onRequestOpen, openDisabledReason, children, className,
}: EnvelopeCardProps) {
  return (
    <section
      aria-label={`${envelope} envelope${sealed ? ' (sealed)' : ''}`}
      className={cx('rounded-card border border-gj-border bg-gj-bg p-gj-6', className)}
    >
      <header className="mb-gj-4 flex items-center justify-between gap-gj-3">
        <h4 className="m-0 flex items-center gap-gj-2 text-gj-h4 text-gj-navy">
          <span className={sealed ? 'text-gj-seal' : 'text-gj-success'} aria-hidden="true">
            {sealed ? <IconLock size={18} /> : <IconLockOpen size={18} />}
          </span>
          {envelope}
        </h4>
        <span
          className={cx(
            'inline-flex items-center gap-gj-1 rounded-pill px-3 py-[3px] text-gj-btn uppercase',
            sealed ? 'border border-gj-seal text-gj-seal' : 'bg-gj-success-fill text-gj-success-on-fill',
          )}
        >
          {sealed ? 'Sealed' : 'Open'}
        </span>
      </header>

      {sealed ? (
        <div>
          {/* Blurred placeholders — pure CSS, no real content behind them */}
          <div aria-hidden="true" className="space-y-gj-2 select-none">
            {[86, 68, 74].map((w, i) => (
              <div key={i} className="h-4 rounded-chip bg-gj-bg-hover blur-[3px]" style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="mb-0 mt-gj-4 text-gj-small text-gj-text-muted">
            {sealedCaption ?? 'Sealed — content is cryptographically inaccessible until the opening condition is met.'}
          </p>
          {onRequestOpen && (
            <div className="mt-gj-4">
              <Button variant="default" size="sm" onClick={onRequestOpen} disabled={!!openDisabledReason} leadingIcon={<IconLockOpen size={14} />}>
                Open commercial envelope
              </Button>
              {openDisabledReason && (
                <p className="mb-0 mt-gj-2 text-gj-small text-gj-warning">{openDisabledReason}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gj-base text-gj-text">{children}</div>
      )}
    </section>
  );
}
