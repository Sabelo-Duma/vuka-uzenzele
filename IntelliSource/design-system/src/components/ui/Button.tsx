import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { IconSpinner } from './icons';

/** C01 Button — ux-design-specification.md §3. Pill, uppercase 12px/600. */
export type ButtonVariant = 'primary' | 'default' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state: spinner replaces label, width preserved, aria-busy. */
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gj-red text-white hover:bg-gj-red-hover',
  default: 'bg-gj-bg-light text-gj-entity-title hover:bg-gj-bg-hover',
  outline: 'bg-transparent text-white border border-[rgba(255,255,255,0.35)] hover:border-white',
  danger: 'bg-gj-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-gj-navy hover:bg-gj-bg-hover',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-[18px] py-2 text-gj-btn',
  md: 'px-[30px] py-3 text-gj-btn',
  lg: 'px-[34px] py-3.5 text-[16px] font-bold',
};

export function Button({
  variant = 'default',
  size = 'md',
  isLoading = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      className={cx(
        'relative inline-flex items-center justify-center gap-gj-2 rounded-pill uppercase tracking-[0.3px]',
        'transition-colors duration-gj-brand ease-gj active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-40 cursor-not-allowed active:scale-100',
        className,
      )}
      {...rest}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <IconSpinner size={16} />
        </span>
      )}
      <span className={cx('inline-flex items-center gap-gj-2', isLoading && 'invisible')}>
        {leadingIcon}
        {children}
      </span>
    </button>
  );
}
