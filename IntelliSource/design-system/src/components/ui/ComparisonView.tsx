import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { IconAlert, IconCheck } from './icons';

/** C11 ComparisonView — side-by-side suppliers, sticky criteria rail, completeness chips, citations. */
export interface ComparisonSupplier {
  id: string;
  name: string;
  rank?: number;
  weightedTotal?: number;
}

export interface ComparisonRow {
  label: string;
  /** Rendered cell per supplier id. */
  cells: Record<string, ReactNode>;
}

export interface ComparisonSection {
  title: string;
  rows: ComparisonRow[];
}

export interface ComparisonViewProps {
  suppliers: ComparisonSupplier[];
  sections: ComparisonSection[];
  className?: string;
}

export function CompletenessChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-gj-1 rounded-chip px-2 py-[2px] text-[11px] font-semibold',
        ok ? 'bg-gj-success-fill/20 text-gj-success' : 'bg-gj-warning-fill/30 text-gj-warning',
      )}
    >
      {ok ? <IconCheck size={11} /> : <IconAlert size={11} />} {label}
    </span>
  );
}

/** Citation superscript linking to a source excerpt (opens Drawer upstream). */
export function CitationRef({ n, onOpen }: { n: number; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open citation ${n} source excerpt`}
      className="ml-1 align-super text-[11px] font-semibold text-gj-ai underline hover:no-underline"
    >
      [{n}]
    </button>
  );
}

export function ComparisonView({ suppliers, sections, className }: ComparisonViewProps) {
  return (
    <div className={cx('overflow-x-auto rounded-card border border-gj-border', className)}>
      <table className="w-full border-collapse text-gj-base">
        <caption className="gj-sr-only">Supplier comparison</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 min-w-[200px] border-b border-gj-border bg-gj-bg px-4 py-3 text-left text-gj-widget uppercase text-gj-navy">
              Criteria
            </th>
            {suppliers.map((s) => (
              <th key={s.id} scope="col" className="min-w-[180px] border-b border-gj-border bg-gj-bg px-4 py-3 text-left">
                <span className="block text-gj-widget uppercase text-gj-navy">{s.name}</span>
                {s.rank !== undefined && (
                  <span className="mt-gj-1 inline-flex items-center gap-gj-2">
                    <span className={cx(
                      'rounded-pill px-2 py-[1px] text-[11px] font-bold uppercase',
                      s.rank === 1 ? 'bg-gj-success-fill text-gj-success-on-fill' : 'bg-gj-bg-hover text-gj-text-muted',
                    )}>
                      #{s.rank}
                    </span>
                    {s.weightedTotal !== undefined && (
                      <span data-numeric className="text-gj-small text-gj-text-muted">{s.weightedTotal.toFixed(2)}</span>
                    )}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        {sections.map((section) => (
          <tbody key={section.title}>
            <tr>
              <th
                colSpan={suppliers.length + 1}
                scope="colgroup"
                className="border-b border-gj-border bg-gj-bg-light px-4 py-2 text-left text-gj-small font-semibold uppercase tracking-[0.5px] text-gj-text-muted"
              >
                {section.title}
              </th>
            </tr>
            {section.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="sticky left-0 z-10 border-b border-gj-border bg-gj-bg px-4 py-3 text-left text-gj-small font-semibold text-gj-navy">
                  {row.label}
                </th>
                {suppliers.map((s) => (
                  <td key={s.id} className="border-b border-gj-border px-4 py-3 align-top text-gj-small text-gj-text">
                    {row.cells[s.id] ?? <span className="text-gj-text-subtle">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
