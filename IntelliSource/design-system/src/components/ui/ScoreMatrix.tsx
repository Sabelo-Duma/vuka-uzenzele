import { cx } from '../../utils/cx';
import { IconAlert, IconLock, IconSparkle } from './icons';

/** C10 ScoreMatrix — criteria × suppliers grid; AI ghost suggestions never pre-fill; CoI gate overlay. */
export interface Criterion {
  id: string;
  name: string;
  weightPercent: number;
  scaleMax: 5 | 10;
}

export interface SupplierColumn {
  id: string;
  name: string;
}

export interface CellState {
  value?: number;
  comment?: string;
  aiSuggested?: number;
  /** Statistical outlier flag (>2σ from panel mean). */
  outlier?: boolean;
  saving?: boolean;
  error?: string;
}

export interface ScoreMatrixProps {
  criteria: Criterion[];
  suppliers: SupplierColumn[];
  /** cells[criterionId][supplierId] */
  cells: Record<string, Record<string, CellState>>;
  onScoreChange?: (criterionId: string, supplierId: string, value: number) => void;
  onApplyAiSuggestion?: (criterionId: string, supplierId: string) => void;
  /** Blocks the grid until the CoI declaration completes (FR-EVAL-03). */
  coiGate?: boolean;
  onDeclareCoi?: () => void;
  readOnly?: boolean;
  /** Weighted totals per supplier (post-consolidation). */
  totals?: Record<string, number>;
  className?: string;
}

export function ScoreMatrix({
  criteria, suppliers, cells, onScoreChange, onApplyAiSuggestion,
  coiGate, onDeclareCoi, readOnly, totals, className,
}: ScoreMatrixProps) {
  if (coiGate) {
    return (
      <div className={cx('relative rounded-card border border-gj-border p-gj-9 text-center', className)}>
        <span className="mb-gj-3 inline-block text-gj-seal" aria-hidden="true"><IconLock size={40} /></span>
        <h4 className="m-0 mb-gj-2 text-gj-h4 text-gj-navy">Declare conflict of interest to begin</h4>
        <p className="mx-auto mb-gj-4 max-w-md text-gj-base text-gj-text-muted">
          Access to submissions requires a completed conflict-of-interest declaration. Your declaration is recorded in the audit trail.
        </p>
        {onDeclareCoi && (
          <button type="button" onClick={onDeclareCoi}
            className="rounded-pill bg-gj-red px-[30px] py-3 text-gj-btn uppercase text-white transition-colors duration-gj-brand ease-gj hover:bg-gj-red-hover">
            Complete CoI declaration
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cx('overflow-x-auto rounded-card border border-gj-border', className)}>
      <table role="grid" aria-label="Evaluation scoring matrix" className="w-full border-collapse text-gj-base">
        <thead>
          <tr>
            <th scope="col" className="min-w-[220px] border-b border-gj-border bg-gj-bg px-4 py-3 text-left text-gj-widget uppercase text-gj-navy">
              Criterion
            </th>
            {suppliers.map((s) => (
              <th key={s.id} scope="col" className="min-w-[140px] border-b border-gj-border bg-gj-bg px-4 py-3 text-left text-gj-widget uppercase text-gj-navy">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c, ri) => (
            <tr key={c.id} className={ri % 2 === 1 ? 'bg-gj-bg-light' : undefined}>
              <th scope="row" className="border-b border-gj-border px-4 py-3 text-left font-normal">
                <span className="block text-gj-text">{c.name}</span>
                <span data-numeric className="text-gj-small text-gj-text-muted">Weight {c.weightPercent}% · scale 0–{c.scaleMax}</span>
              </th>
              {suppliers.map((s) => {
                const cell = cells[c.id]?.[s.id] ?? {};
                return (
                  <td key={s.id} className={cx('border-b border-gj-border px-4 py-3 align-top', cell.outlier && 'bg-gj-warning-fill/20')}>
                    <div className="flex items-center gap-gj-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={c.scaleMax}
                        step={0.5}
                        value={cell.value ?? ''}
                        disabled={readOnly}
                        aria-label={`Score for ${s.name}, ${c.name}`}
                        aria-invalid={cell.error ? true : undefined}
                        onChange={(e) => {
                          const v = e.target.value === '' ? NaN : Number(e.target.value);
                          if (!Number.isNaN(v)) onScoreChange?.(c.id, s.id, v);
                        }}
                        className={cx(
                          'h-9 w-20 rounded-pill border bg-transparent px-3 text-gj-small text-gj-text outline-none',
                          'focus:border-gj-border-strong [font-variant-numeric:tabular-nums]',
                          cell.error ? 'border-gj-danger' : 'border-gj-border',
                          readOnly && 'opacity-60',
                        )}
                      />
                      {cell.saving && <span className="text-gj-text-subtle text-gj-small" role="status">Saving…</span>}
                      {cell.outlier && (
                        <span className="text-gj-warning" title="More than 2σ from the panel mean for this criterion">
                          <IconAlert size={14} />
                          <span className="gj-sr-only">Outlier: more than 2 standard deviations from panel mean</span>
                        </span>
                      )}
                    </div>
                    {cell.aiSuggested !== undefined && cell.value === undefined && !readOnly && (
                      <button
                        type="button"
                        onClick={() => onApplyAiSuggestion?.(c.id, s.id)}
                        className="mt-gj-1 inline-flex items-center gap-gj-1 rounded-chip border border-gj-ai/60 px-2 py-[2px] text-[11px] font-semibold text-gj-ai hover:bg-gj-ai/10"
                      >
                        <IconSparkle size={11} /> AI-suggested {cell.aiSuggested} — Apply
                      </button>
                    )}
                    {cell.error && (
                      <p role="alert" className="m-0 mt-gj-1 text-[12px] text-gj-danger">{cell.error}</p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="bg-gj-navy text-white">
              <th scope="row" className="px-4 py-3 text-left text-gj-widget uppercase">Weighted total</th>
              {suppliers.map((s) => (
                <td key={s.id} data-numeric className="px-4 py-3 font-semibold">
                  {totals[s.id]?.toFixed(2) ?? '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
