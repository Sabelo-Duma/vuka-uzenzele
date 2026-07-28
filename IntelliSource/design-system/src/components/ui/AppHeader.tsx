import type { ReactNode } from 'react';
import { useState } from 'react';
import { cx } from '../../utils/cx';
import { IconX } from './icons';

/** C18 Header / Navigation — sticky navy 71px (60px mobile); uppercase nav; off-canvas ≤1024px. */
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface AppHeaderProps {
  /** Brand slot — Gijima logo img (white with red dots, height 40px). */
  logo: ReactNode;
  nav: NavItem[];
  /** Right cluster: search, bell, ThemeToggle, avatar menu. */
  actions?: ReactNode;
  /** Supplier-portal variant: simplified bar + timezone note. */
  variant?: 'internal' | 'supplier';
  timezoneNote?: string;
  className?: string;
}

export function AppHeader({ logo, nav, actions, variant = 'internal', timezoneNote, className }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={cx('sticky top-0 z-40 bg-[#0E355A] dark:bg-[#0D182B]', className)} style={{ background: 'var(--gj-header-bg, #0E355A)' }}>
      <div className="mx-auto flex h-gj-header-mobile desktop:h-gj-header max-w-gj-container items-center justify-between gap-gj-4 px-gj-4">
        <div className="flex items-center gap-gj-6">
          <a href="/" aria-label="IntelliSource home" className="flex items-center">{logo}</a>
          <nav aria-label="Primary" className="hidden desktop:block">
            <ul className="m-0 flex list-none gap-gj-6 p-0">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    className={cx(
                      'border-b-2 pb-1 text-[15px] font-semibold uppercase no-underline transition-colors duration-gj-brand ease-gj',
                      item.active
                        ? 'border-gj-red text-white'
                        : 'border-transparent text-white/80 hover:text-white',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-gj-3">
          {variant === 'supplier' && timezoneNote && (
            <span className="hidden text-gj-small text-white/70 tablet:inline">{timezoneNote}</span>
          )}
          <div className="hidden items-center gap-gj-3 desktop:flex">{actions}</div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-pill desktop:hidden"
          >
            <span className="h-[2px] w-5 bg-white" aria-hidden="true" />
            <span className="h-[2px] w-5 bg-white" aria-hidden="true" />
            <span className="h-[2px] w-5 bg-white" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Off-canvas menu (≤1024px) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 desktop:hidden" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }} style={{ background: 'rgba(13,24,43,0.55)' }}>
          <nav aria-label="Primary (mobile)" className="absolute right-0 top-0 h-full w-72 overflow-y-auto p-gj-5" style={{ background: '#0E355A' }}>
            <div className="mb-gj-5 flex items-center justify-between">
              <span className="text-gj-widget uppercase text-white">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-pill p-2 text-white/80 hover:text-white">
                <IconX size={16} />
              </button>
            </div>
            <ul className="m-0 list-none space-y-gj-4 p-0">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    className={cx('text-[15px] font-semibold uppercase no-underline', item.active ? 'text-white' : 'text-white/80 hover:text-white')}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {actions && <div className="mt-gj-6 flex items-center gap-gj-3 border-t border-white/20 pt-gj-4">{actions}</div>}
          </nav>
        </div>
      )}
    </header>
  );
}

/** Notification bell with unread badge (part of C18 right cluster). */
export function NotificationBell({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `Notifications — ${count} unread` : 'Notifications'}
      className="relative flex h-9 w-9 items-center justify-center rounded-pill text-white/80 hover:bg-white/10 hover:text-white"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {count > 0 && (
        <span data-numeric className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-gj-red px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
