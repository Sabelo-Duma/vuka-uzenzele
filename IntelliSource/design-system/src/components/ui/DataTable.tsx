import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Banner } from './Feedback';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Button } from './Button';

/** C05 DataTable — striped, sticky header, aria-sort, skeleton/empty/error states, mobile card fallback. */
export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  /** Numeric column → right-aligned, tabular numerals. */
  numeric?: boolean;
  /** Hide below tablet breakpoint (mobile card view shows label:value pairs instead). */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyState?: ReactNode;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  /** Row ids to pulse-highlight after live updates (SignalR); announced politely. */
  highlightedRowKeys?: ReadonlySet<string>;
  className?: string;
}

export function DataTable<T>({
  columns, rows, rowKey, caption, isLoading, error, onRetry, emptyState,
  sortKey, sortDirection, onSort, highlightedRowKeys, className,
}: DataTableProps<T>) {
  if (isLoading) return <Skeleton variant="tableRows" count={8} className={className} />;

  if (error) {
    return (
      <div className={className}>
        <Banner tone="danger">
          <span className="flex flex-wrap items-center gap-gj-3">
            {error}
            {onRetry && <Button size="sm" variant="default" onClick={onRetry}>Retry</Button>}
          </span>
        </Banner>
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className={className}>{emptyState ?? <EmptyState title="Nothing here yet" />}</div>;
  }

  return (
    <div className={cx('overflow-x-auto rounded-card border border-gj-border', className)}>
      <table className="w-full border-collapse text-gj-base">
        <caption className="gj-sr-only">{caption}</caption>
        <thead>
          <tr className="sticky top-0 bg-gj-bg">
            {columns.map((col) => {
              const active = sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={col.sortable ? (active ?? 'none') : undefined}
                  className={cx(
                    'border-b border-gj-border px-4 py-3 text-left text-gj-widget uppercase text-gj-navy',
                    col.numeric && 'text-right',
                    col.hideOnMobile && 'hidden tablet:table-cell',
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-gj-1 uppercase hover:text-gj-red-hover"
                    >
                      {col.header}
                      <span aria-hidden="true" className="text-gj-text-subtle">
                        {active === 'ascending' ? '▲' : active === 'descending' ? '▼' : '↕'}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody aria-live="polite">
          {rows.map((row, i) => {
            const key = rowKey(row);
            const highlighted = highlightedRowKeys?.has(key);
            return (
              <tr
                key={key}
                className={cx(
                  'transition-colors duration-gj-brand ease-gj hover:bg-gj-bg-hover focus-within:bg-gj-bg-hover',
                  i % 2 === 1 && 'bg-gj-bg-light',
                  highlighted && 'outline outline-2 outline-gj-info motion-safe:animate-gj-pulse-soft',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    data-numeric={col.numeric || undefined}
                    className={cx(
                      'border-b border-gj-border px-4 py-3 text-gj-text',
                      col.numeric && 'text-right',
                      col.hideOnMobile && 'hidden tablet:table-cell',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
