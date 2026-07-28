import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cx } from '../../utils/cx';
import { IconAlert, IconSpinner } from './icons';

/** C02 Input / Select / Textarea — pill fields 42px, label 14px navy, inline errors. */

interface FieldChromeProps {
  label: string;
  required?: boolean;
  /** Inline error message (C12 InlineError pattern). Sets aria-invalid + describedby. */
  error?: string | null;
  hint?: string;
  /** Async-validation indicator (right slot spinner). */
  isValidating?: boolean;
  children: (a11y: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
  }) => ReactNode;
  className?: string;
}

function FieldChrome({ label, required, error, hint, isValidating, children, className }: FieldChromeProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('flex flex-col', className)}>
      <label htmlFor={id} className="mb-gj-2 text-gj-small text-gj-navy">
        {label}
        {required && (
          <span className="text-gj-danger" aria-hidden="true"> *</span>
        )}
      </label>
      <div className="relative">
        {children({
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
          'aria-required': required || undefined,
        })}
        {isValidating && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gj-text-muted" aria-hidden="true">
            <IconSpinner size={14} />
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-gj-1 text-gj-small text-gj-text-muted">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-gj-1 inline-flex items-center gap-gj-1 text-gj-small text-gj-danger">
          <IconAlert size={14} /> {error}
        </p>
      )}
    </div>
  );
}

const fieldBase =
  'w-full h-gj-form px-5 bg-transparent text-gj-small text-gj-text border rounded-pill outline-none ' +
  'transition-colors duration-gj-brand ease-gj placeholder:text-gj-text-subtle ' +
  'focus:border-gj-border-strong disabled:bg-gj-bg-light disabled:opacity-60 disabled:cursor-not-allowed';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string | null;
  hint?: string;
  isValidating?: boolean;
  containerClassName?: string;
}

export function TextInput({ label, error, hint, isValidating, required, containerClassName, className, ...rest }: TextInputProps) {
  return (
    <FieldChrome label={label} required={required} error={error} hint={hint} isValidating={isValidating} className={containerClassName}>
      {(a11y) => (
        <input
          {...a11y}
          required={required}
          className={cx(fieldBase, error ? 'border-gj-danger' : 'border-gj-border', className)}
          {...rest}
        />
      )}
    </FieldChrome>
  );
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string | null;
  hint?: string;
  containerClassName?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({ label, error, hint, required, containerClassName, className, options, placeholder, ...rest }: SelectFieldProps) {
  return (
    <FieldChrome label={label} required={required} error={error} hint={hint} className={containerClassName}>
      {(a11y) => (
        <select
          {...a11y}
          required={required}
          className={cx(fieldBase, 'appearance-none pr-10', error ? 'border-gj-danger' : 'border-gj-border', className)}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </FieldChrome>
  );
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string | null;
  hint?: string;
  containerClassName?: string;
}

export function TextArea({ label, error, hint, required, containerClassName, className, ...rest }: TextAreaProps) {
  return (
    <FieldChrome label={label} required={required} error={error} hint={hint} className={containerClassName}>
      {(a11y) => (
        <textarea
          {...a11y}
          required={required}
          className={cx(
            fieldBase,
            'h-auto min-h-[140px] py-3.5 px-5 rounded-textarea resize-y',
            error ? 'border-gj-danger' : 'border-gj-border',
            className,
          )}
          {...rest}
        />
      )}
    </FieldChrome>
  );
}
