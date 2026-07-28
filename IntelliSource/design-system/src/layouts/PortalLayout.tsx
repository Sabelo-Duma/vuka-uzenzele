import type { ReactNode } from 'react';
import { SkipToContent } from '../utils/a11y/SkipToContent';

/** P07/P08 Supplier portal — simplified header, card grid or event detail, sticky action bar slot. */
export interface PortalLayoutProps {
  header: ReactNode;
  banners?: ReactNode;
  children: ReactNode;
  /** Sticky bottom bar (e.g. submit response) — thumb-reachable on mobile. */
  stickyBar?: ReactNode;
}

export function PortalLayout({ header, banners, children, stickyBar }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gj-bg-light font-gj text-gj-base text-gj-text">
      <SkipToContent />
      {header}
      {banners}
      <main id="main-content" className="mx-auto w-full max-w-gj-container flex-1 px-gj-4 py-gj-5 pb-28 tablet:px-gj-6">
        {children}
      </main>
      {stickyBar && (
        <div className="sticky bottom-0 z-30 border-t border-gj-border bg-gj-bg p-gj-4 shadow-gj-2">
          <div className="mx-auto flex max-w-gj-container flex-wrap items-center justify-between gap-gj-3">{stickyBar}</div>
        </div>
      )}
    </div>
  );
}

/** Card grid for the supplier event list (1-col mobile / 2-col tablet / 3-col desktop). */
export function PortalCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-gj-4 tablet:grid-cols-2 desktop:grid-cols-3">{children}</div>;
}
