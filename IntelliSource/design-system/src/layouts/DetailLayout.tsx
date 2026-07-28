import type { ReactNode } from 'react';

/** P06 RFx detail/review + P11 Audit — header with lifecycle stepper, tab bar, optional sticky decision bar. */
export interface DetailLayoutProps {
  /** Number (mono) + title + StatusBadge + CountdownChip. */
  eventHeader: ReactNode;
  /** LifecycleStepper region. */
  stepper?: ReactNode;
  /** Tab navigation (Overview / Documents / Suppliers / Q&A / CRs / Audit). */
  tabs?: ReactNode;
  children: ReactNode;
  /** Reviewer sticky decision bar (Approve / Clarify / Reject). */
  decisionBar?: ReactNode;
}

export function DetailLayout({ eventHeader, stepper, tabs, children, decisionBar }: DetailLayoutProps) {
  return (
    <div className="space-y-gj-5 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-gj-3">{eventHeader}</header>
      {stepper && <div className="overflow-x-auto rounded-card border border-gj-border bg-gj-bg p-gj-4">{stepper}</div>}
      {tabs && <nav aria-label="Event sections" className="flex flex-wrap gap-gj-2 border-b border-gj-border pb-gj-2">{tabs}</nav>}
      <div>{children}</div>
      {decisionBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gj-border bg-gj-bg p-gj-4 shadow-gj-2">
          <div className="mx-auto flex max-w-gj-container flex-wrap items-center justify-end gap-gj-3">{decisionBar}</div>
        </div>
      )}
    </div>
  );
}
