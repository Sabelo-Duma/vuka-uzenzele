import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Skeleton } from './Skeleton';

/** C17 KPICard — eyebrow label, 30px navy value (tabular), delta chip; chart slots lazy-load upstream. */
export interface KpiCardProps {
  label: string;
  value?: string;
  /** Positive = ▲ success, negative = ▼ danger. Provide preformatted text e.g. "12% vs last quarter". */
  delta?: { direction: 'up' | 'down'; text: string; /** invert when down is good (e.g. cycle time) */ positiveIsGood?: boolean };
  /** Optional sparkline / mini-chart slot. */
  chart?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function KpiCard({ label, value, delta, chart, isLoading, error, onRetry, className }: KpiCardProps) {
  if (isLoading) return <Skeleton variant="kpiCard" className={className} />;

  const deltaGood = delta ? (delta.direction === 'up') === (delta.positiveIsGood ?? true) : false;

  return (
    <div className={cx('rounded-card border border-gj-border bg-gj-bg p-gj-6 shadow-gj-1', className)}>
      <span className="gj-eyebrow">{label}</span>
      {error ? (
        <div>
          <p className="m-0 text-gj-small text-gj-danger">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-gj-1 text-gj-small text-gj-link underline hover:no-underline">
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-gj-3">
            <span data-numeric className="text-gj-h3 font-semibold text-gj-navy">{value ?? '—'}</span>
            {delta && (
              <span
                className={cx(
                  'inline-flex items-center gap-gj-1 rounded-chip px-2 py-[2px] text-[11px] font-semibold',
                  deltaGood ? 'bg-gj-success-fill/20 text-gj-success' : 'bg-gj-danger-fill/15 text-gj-danger',
                )}
              >
                <span aria-hidden="true">{delta.direction === 'up' ? '▲' : '▼'}</span>
                <span className="gj-sr-only">{delta.direction === 'up' ? 'Up' : 'Down'}</span>
                {delta.text}
              </span>
            )}
          </div>
          {chart && <div className="mt-gj-3">{chart}</div>}
        </>
      )}
    </div>
  );
}

/** Chart container with a11y data-table toggle contract (UX C17): pass renderTable for the accessible view. */
export interface ChartCardProps {
  title: string;
  chart: ReactNode;
  renderTable: () => ReactNode;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ChartCard({ title, chart, renderTable, onExportCsv, onExportPdf, isLoading, error, onRetry, className }: ChartCardProps) {
  return (
    <section aria-label={title} className={cx('rounded-card border border-gj-border bg-gj-bg p-gj-6 shadow-gj-1', className)}>
      <header className="mb-gj-4 flex flex-wrap items-center justify-between gap-gj-2">
        <h4 className="m-0 text-gj-h4 text-gj-navy">{title}</h4>
        <div className="flex gap-gj-2">
          {onExportCsv && (
            <button type="button" onClick={onExportCsv} className="rounded-pill border border-gj-border px-3 py-1 text-gj-btn uppercase text-gj-text-muted hover:bg-gj-bg-hover">CSV</button>
          )}
          {onExportPdf && (
            <button type="button" onClick={onExportPdf} className="rounded-pill border border-gj-border px-3 py-1 text-gj-btn uppercase text-gj-text-muted hover:bg-gj-bg-hover">PDF</button>
          )}
        </div>
      </header>
      {isLoading ? (
        <Skeleton variant="rect" height="180px" />
      ) : error ? (
        <div className="py-gj-6 text-center">
          <p className="m-0 text-gj-small text-gj-danger">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-gj-1 text-gj-small text-gj-link underline hover:no-underline">Retry</button>
          )}
        </div>
      ) : (
        <>
          <div aria-hidden="true">{chart}</div>
          <details className="mt-gj-3">
            <summary className="cursor-pointer text-gj-small text-gj-link">View as data table</summary>
            <div className="mt-gj-2">{renderTable()}</div>
          </details>
        </>
      )}
    </section>
  );
}
