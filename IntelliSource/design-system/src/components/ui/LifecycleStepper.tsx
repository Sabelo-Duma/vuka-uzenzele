import { Fragment } from 'react';
import { cx } from '../../utils/cx';
import { IconCheck } from './icons';

/** C06 LifecycleStepper — horizontal (desktop) / vertical (mobile); RFQ path renders skipped steps dashed. */
export type StepState = 'completed' | 'current' | 'future' | 'skipped';

export interface LifecycleStep {
  label: string;
  state: StepState;
  /** Tooltip for skipped steps, e.g. "Approval skipped — RFQ short path". */
  note?: string;
}

export interface LifecycleStepperProps {
  steps: LifecycleStep[];
  /** Vertical orientation (mobile default via CSS; force with this prop). */
  vertical?: boolean;
  className?: string;
}

export const DEFAULT_RFX_STEPS: LifecycleStep[] = [
  { label: 'Intake', state: 'completed' },
  { label: 'Draft', state: 'completed' },
  { label: 'Review', state: 'current' },
  { label: 'Approval', state: 'future' },
  { label: 'Published', state: 'future' },
  { label: 'Closed', state: 'future' },
  { label: 'Evaluation', state: 'future' },
  { label: 'Award', state: 'future' },
];

function Dot({ state }: { state: StepState }) {
  if (state === 'completed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gj-navy text-white">
        <IconCheck size={12} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gj-red bg-gj-bg">
        <span className="h-2 w-2 rounded-full bg-gj-red" />
      </span>
    );
  }
  return (
    <span
      className={cx(
        'h-6 w-6 rounded-full border-2 bg-transparent',
        state === 'skipped' ? 'border-dashed border-gj-border-strong' : 'border-gj-border-strong',
      )}
    />
  );
}

export function LifecycleStepper({ steps, vertical = false, className }: LifecycleStepperProps) {
  return (
    <ol
      className={cx(
        'flex list-none p-0 m-0',
        vertical ? 'flex-col gap-0' : 'flex-col tablet:flex-row tablet:items-start',
        className,
      )}
    >
      {steps.map((step, i) => (
        <Fragment key={step.label}>
          <li
            aria-current={step.state === 'current' ? 'step' : undefined}
            title={step.note}
            className={cx('flex items-center gap-gj-2', !vertical && 'tablet:flex-col tablet:gap-gj-1 tablet:text-center')}
          >
            <Dot state={step.state} />
            <span
              className={cx(
                'text-gj-small whitespace-nowrap',
                step.state === 'current' ? 'font-semibold text-gj-text' : 'text-gj-text-muted',
              )}
            >
              {step.label}
              {step.state === 'skipped' && <span className="gj-sr-only"> (skipped)</span>}
              {step.state === 'completed' && <span className="gj-sr-only"> (completed)</span>}
            </span>
          </li>
          {i < steps.length - 1 && (
            <li aria-hidden="true" className={cx('flex', vertical ? 'ml-3 h-5 w-px' : 'ml-3 h-5 w-px tablet:ml-0 tablet:mt-3 tablet:h-px tablet:w-10 tablet:flex-none tablet:self-start')}>
              <span
                className={cx(
                  'block h-full w-full transition-all duration-gj-brand ease-gj',
                  steps[i + 1].state === 'skipped' || step.state === 'skipped'
                    ? 'border-l tablet:border-l-0 tablet:border-t border-dashed border-gj-border-strong'
                    : step.state === 'completed'
                      ? 'bg-gj-navy'
                      : 'bg-gj-border-strong',
                )}
              />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
