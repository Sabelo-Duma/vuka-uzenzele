import type { ReactNode } from 'react';

/**
 * Responsive dashboard layout.
 * - Mobile: single column (just the main content; aside is hidden).
 * - Desktop (lg+): main content + a sticky right-hand rail.
 * Keeps the mobile experience untouched while giving large screens a
 * proper two-column, enterprise dashboard feel.
 */
export function Dashboard({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  if (!aside) return <>{children}</>;
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_312px] lg:gap-6 lg:items-start">
      <div className="min-w-0">{children}</div>
      <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-4">{aside}</aside>
    </div>
  );
}
