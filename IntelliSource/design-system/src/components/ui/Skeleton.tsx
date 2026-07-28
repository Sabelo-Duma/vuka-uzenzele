import { cx } from '../../utils/cx';

/** C19 SkeletonLoader — shapes mirror target layout; shimmer 1200ms; static under reduced motion. */
export interface SkeletonProps {
  variant?: 'line' | 'circle' | 'rect' | 'tableRows' | 'kpiCard' | 'chatBubble';
  /** For tableRows: number of rows (default 8, per UX C05). */
  count?: number;
  width?: string;
  height?: string;
  className?: string;
}

const shimmer =
  'bg-[linear-gradient(90deg,var(--gj-bg-hover)_25%,var(--gj-bg-light)_50%,var(--gj-bg-hover)_75%)] ' +
  'bg-[length:200%_100%] animate-gj-shimmer motion-reduce:animate-none';

export function Skeleton({ variant = 'line', count = 8, width, height, className }: SkeletonProps) {
  if (variant === 'tableRows') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading table" className={cx('space-y-gj-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cx('h-10 rounded-card', shimmer)} />
        ))}
      </div>
    );
  }
  if (variant === 'kpiCard') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading KPI" className={cx('rounded-card border border-gj-border p-gj-6', className)}>
        <div className={cx('mb-gj-3 h-3 w-1/3 rounded-chip', shimmer)} />
        <div className={cx('h-8 w-1/2 rounded-chip', shimmer)} />
      </div>
    );
  }
  if (variant === 'chatBubble') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading conversation" className={cx('space-y-gj-3', className)}>
        <div className={cx('h-14 w-3/4 rounded-card', shimmer)} />
        <div className={cx('ml-auto h-10 w-1/2 rounded-card', shimmer)} />
        <div className={cx('h-14 w-2/3 rounded-card', shimmer)} />
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-busy="true"
      className={cx(
        shimmer,
        variant === 'circle' ? 'rounded-full' : variant === 'rect' ? 'rounded-card' : 'rounded-chip',
        className,
      )}
      style={{
        width: width ?? (variant === 'circle' ? '40px' : '100%'),
        height: height ?? (variant === 'circle' ? '40px' : variant === 'rect' ? '120px' : '12px'),
      }}
    />
  );
}
