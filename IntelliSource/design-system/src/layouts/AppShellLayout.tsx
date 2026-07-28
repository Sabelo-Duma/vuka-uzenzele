import type { ReactNode } from 'react';
import { SkipToContent } from '../utils/a11y/SkipToContent';

/** Base shell for all internal pages — skip link, banner/header slot, main landmark, footer. */
export interface AppShellLayoutProps {
  header: ReactNode;
  /** Page-level banners (offline, AI-degraded) render directly under the header. */
  banners?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AppShellLayout({ header, banners, children, footer }: AppShellLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gj-bg font-gj text-gj-base text-gj-text">
      <SkipToContent />
      {header}
      {banners}
      <main id="main-content" className="mx-auto w-full max-w-gj-container flex-1 px-gj-4 py-gj-6 tablet:px-gj-6">
        {children}
      </main>
      {footer && (
        <footer className="bg-gj-navy py-gj-8 text-gj-small" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <div className="mx-auto max-w-gj-container px-gj-4">{footer}</div>
        </footer>
      )}
    </div>
  );
}
