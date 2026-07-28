import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { IconCheck } from './icons';

/** C20 Wizard — RFx create/edit shell: step header, autosave chip, sticky footer, error-summary contract. */
export type AutosaveState = 'saved' | 'saving' | 'offline';

export interface WizardStep {
  id: string;
  label: string;
  /** Step has validation errors (renders alert dot). */
  hasErrors?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  currentStepId: string;
  onStepSelect?: (id: string) => void;
  autosave?: { state: AutosaveState; lastSavedLabel?: string };
  /** Error summary (role=alert) — links move focus to fields upstream. */
  errorSummary?: Array<{ label: string; fieldId: string }>;
  onBack?: () => void;
  onNext?: () => void;
  /** Final step action, e.g. "Submit for review". */
  finalAction?: { label: string; onClick: () => void; disabled?: boolean };
  isSubmitting?: boolean;
  children: ReactNode;
  className?: string;
}

function AutosaveChip({ state, lastSavedLabel }: { state: AutosaveState; lastSavedLabel?: string }) {
  const text =
    state === 'saving' ? 'Saving…' : state === 'offline' ? 'Offline — retrying' : `Saved ${lastSavedLabel ?? ''}`.trim();
  return (
    <span
      role="status"
      className={cx(
        'inline-flex items-center gap-gj-1 rounded-chip px-2 py-[2px] text-[11px] font-semibold',
        state === 'offline' ? 'bg-gj-warning-fill/30 text-gj-warning' : 'bg-gj-bg-hover text-gj-text-muted',
      )}
    >
      {state === 'saved' && <IconCheck size={11} />}
      {text}
    </span>
  );
}

export function Wizard({
  steps, currentStepId, onStepSelect, autosave, errorSummary,
  onBack, onNext, finalAction, isSubmitting, children, className,
}: WizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const isLast = currentIndex === steps.length - 1;

  return (
    <div className={cx('flex min-h-[420px] flex-col rounded-card border border-gj-border bg-gj-bg', className)}>
      <header className="flex flex-wrap items-center justify-between gap-gj-3 border-b border-gj-border p-gj-5">
        <ol className="m-0 flex list-none flex-wrap gap-gj-4 p-0">
          {steps.map((step, i) => {
            const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'future';
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepSelect?.(step.id)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={cx(
                    'inline-flex items-center gap-gj-2 rounded-pill px-3 py-1 text-gj-small transition-colors duration-gj-fast ease-gj',
                    state === 'current' && 'bg-gj-navy text-white font-semibold',
                    state === 'done' && 'text-gj-navy hover:bg-gj-bg-hover',
                    state === 'future' && 'text-gj-text-muted hover:bg-gj-bg-hover',
                  )}
                >
                  <span
                    data-numeric
                    className={cx(
                      'flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold',
                      state === 'current' ? 'border-white' : state === 'done' ? 'border-gj-navy bg-gj-navy text-white' : 'border-gj-border-strong',
                    )}
                    aria-hidden="true"
                  >
                    {state === 'done' ? <IconCheck size={10} /> : i + 1}
                  </span>
                  {step.label}
                  {step.hasErrors && (
                    <span className="h-2 w-2 rounded-full bg-gj-danger" aria-label="Step has errors" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        {autosave && <AutosaveChip state={autosave.state} lastSavedLabel={autosave.lastSavedLabel} />}
      </header>

      {errorSummary && errorSummary.length > 0 && (
        <div role="alert" className="border-b border-gj-danger bg-gj-danger-fill/10 px-gj-5 py-gj-3">
          <p className="m-0 mb-gj-1 text-gj-small font-semibold text-gj-danger">
            Fix the following before continuing:
          </p>
          <ul className="m-0 list-disc pl-5">
            {errorSummary.map((e) => (
              <li key={e.fieldId}>
                <a href={`#${e.fieldId}`} className="text-gj-small text-gj-danger underline hover:no-underline">
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 p-gj-6">{children}</div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-gj-3 border-t border-gj-border bg-gj-bg p-gj-4">
        <Button variant="ghost" onClick={onBack} disabled={currentIndex === 0 || isSubmitting}>
          Back
        </Button>
        <div className="flex gap-gj-3">
          {!isLast && (
            <Button variant="primary" onClick={onNext} disabled={isSubmitting}>
              Next
            </Button>
          )}
          {isLast && finalAction && (
            <Button variant="primary" onClick={finalAction.onClick} disabled={finalAction.disabled} isLoading={isSubmitting}>
              {finalAction.label}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
