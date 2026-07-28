import type { ReactNode } from 'react';

/** P09 Evaluation workspace — event header, left supplier rail, tabbed main region. */
export interface EvaluationLayoutProps {
  /** RFx number + title + StatusBadge + gates. */
  eventHeader: ReactNode;
  /** Supplier list with completeness chips. */
  supplierRail: ReactNode;
  /** Tab bar (Completeness / Scoring / Commercial / Comparison / Summary). */
  tabs: ReactNode;
  children: ReactNode;
}

export function EvaluationLayout({ eventHeader, supplierRail, tabs, children }: EvaluationLayoutProps) {
  return (
    <div className="space-y-gj-5">
      <header className="flex flex-wrap items-center justify-between gap-gj-3">{eventHeader}</header>
      <div className="grid gap-gj-6 desktop:grid-cols-12">
        <aside aria-label="Suppliers" className="desktop:col-span-3">
          <div className="rounded-card border border-gj-border bg-gj-bg p-gj-4 desktop:sticky desktop:top-24">
            {supplierRail}
          </div>
        </aside>
        <section className="min-w-0 desktop:col-span-9">
          <div role="tablist" aria-label="Evaluation sections" className="mb-gj-4 flex flex-wrap gap-gj-2 border-b border-gj-border pb-gj-2">
            {tabs}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

/** Tab button used within EvaluationLayout's tablist. */
export function EvaluationTab({ label, active, onSelect, badge }: { label: string; active?: boolean; onSelect?: () => void; badge?: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ?? false}
      onClick={onSelect}
      className={
        active
          ? 'inline-flex items-center gap-gj-2 rounded-pill bg-gj-navy px-4 py-2 text-gj-btn uppercase text-white'
          : 'inline-flex items-center gap-gj-2 rounded-pill px-4 py-2 text-gj-btn uppercase text-gj-text-muted hover:bg-gj-bg-hover'
      }
    >
      {label}
      {badge}
    </button>
  );
}
