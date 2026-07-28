import type { ReactNode } from 'react';

/** P02 Dashboard — KPI row (4-up), main table region, right action rail (collapses below on ≤1024px). */
export interface DashboardLayoutProps {
  /** Page heading region (title + primary actions e.g. "+ New Request"). */
  pageHeader: ReactNode;
  kpis: ReactNode;
  table: ReactNode;
  /** "My approvals" + "Closing soon" rail. */
  rail?: ReactNode;
}

export function DashboardLayout({ pageHeader, kpis, table, rail }: DashboardLayoutProps) {
  return (
    <div className="space-y-gj-6">
      <div className="flex flex-wrap items-center justify-between gap-gj-3">{pageHeader}</div>
      <section aria-label="Key performance indicators" className="grid gap-gj-4 tablet:grid-cols-2 desktop:grid-cols-4">
        {kpis}
      </section>
      <div className="grid gap-gj-6 desktop:grid-cols-12">
        <section aria-label="Sourcing pipeline" className="min-w-0 desktop:col-span-8 wide:col-span-9">
          {table}
        </section>
        {rail && (
          <aside aria-label="My actions" className="space-y-gj-4 desktop:col-span-4 wide:col-span-3">
            {rail}
          </aside>
        )}
      </div>
    </div>
  );
}
