import type { ReactNode } from 'react';

/** P01 Login/Landing — full-bleed navy hero, white hero title + red dot, centered card slot. */
export interface AuthLayoutProps {
  heroTitle: string;
  heroSubtitle?: string;
  /** Sign-in card (Microsoft SSO or supplier email/password). */
  card: ReactNode;
  /** POPIA notice / footer links. */
  footerLinks?: ReactNode;
}

export function AuthLayout({ heroTitle, heroSubtitle, card, footerLinks }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col font-gj" style={{ background: '#0E355A' }}>
      <main id="main-content" className="mx-auto flex w-full max-w-gj-container flex-1 flex-col items-center justify-center gap-gj-8 px-gj-4 py-gj-11 desktop:flex-row desktop:justify-between">
        <div className="max-w-xl text-center desktop:text-left">
          <h1 className="m-0 text-gj-hero font-bold leading-[1.15] text-white">
            {heroTitle}
            <span className="text-gj-red">.</span>
          </h1>
          {heroSubtitle && (
            <p className="mx-auto mt-gj-4 max-w-lg text-gj-base desktop:mx-0" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {heroSubtitle}
            </p>
          )}
        </div>
        <div className="w-full max-w-[420px] rounded-card bg-gj-bg p-gj-7 shadow-gj-3">{card}</div>
      </main>
      {footerLinks && (
        <footer className="py-gj-5 text-center text-gj-small" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {footerLinks}
        </footer>
      )}
    </div>
  );
}
