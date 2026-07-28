import type { ReactNode } from 'react';

/** Screen-reader-only content. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="gj-sr-only">{children}</span>;
}
