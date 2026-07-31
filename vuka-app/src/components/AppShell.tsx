import type { ReactNode } from 'react';
import { useApp, type Screen } from '../store/appStore';
import { useTheme } from '../providers/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { InstallButton } from './InstallButton';

interface NavItem { screen: Screen; label: string; icon: IconName; }

const WORKER_NAV: NavItem[] = [
  { screen: 'home', label: 'Home', icon: 'home' },
  { screen: 'jobs', label: 'Jobs', icon: 'jobs' },
  { screen: 'cv', label: 'Ladder', icon: 'ladder' },
  { screen: 'me', label: 'Me', icon: 'user' },
];
const EMPLOYER_NAV: NavItem[] = [
  { screen: 'home', label: 'Home', icon: 'home' },
  { screen: 'talent', label: 'Talent', icon: 'talent' },
  { screen: 'post', label: 'Post', icon: 'briefcase' },
  { screen: 'me', label: 'Me', icon: 'user' },
];

/** Which primary tab a (possibly detail) screen belongs to. */
function activeTab(screen: Screen): Screen {
  if (screen === 'gigDetail' || screen === 'formalDetail') return 'jobs';
  if (screen === 'workerDetail') return 'talent';
  if (screen === 'chat') return 'messages';
  return screen;
}

/** Unread-count pill for the Messages entries. */
function UnreadBadge({ count, onDark }: { count: number; onDark?: boolean }) {
  if (count <= 0) return null;
  return (
    <span className={`grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tnum ${onDark ? 'bg-white text-red' : 'bg-red text-white'}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-bold text-navy">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red" />
      {!compact && <span className="text-lg">Vuka Uzenzele</span>}
    </div>
  );
}

function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
      className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy hover:bg-surface-2 transition active:scale-95"
    >
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}

function AccountBar() {
  const { state, logout } = useApp();
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="text-[11px] text-subtle uppercase tracking-wide font-bold">Signed in</div>
      <div className="text-sm font-bold text-navy truncate">{state.user?.name ?? 'You'}</div>
      <div className="text-[11px] text-muted mb-2 capitalize">{state.role} account</div>
      <button onClick={logout} className="w-full rounded-pill border border-line-strong text-navy text-[13px] font-bold py-2 hover:bg-surface transition active:scale-95">Log out</button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, navigate } = useApp();
  const nav = state.role === 'worker' ? WORKER_NAV : EMPLOYER_NAV;
  const current = activeTab(state.nav.screen);
  const fabTarget: Screen = state.role === 'worker' ? 'jobs' : 'post';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-surface-2 text-ink">
      {/* Center the whole app (sidebar + content) on large screens so the
          sidebar sits next to the content instead of being stranded far-left.
          On desktop the shell is pinned to the viewport height so the sidebar
          stays put and only the content column scrolls. */}
      <div className="mx-auto flex min-h-screen lg:h-full lg:min-h-0 w-full max-w-[1440px] xl:border-x xl:border-line">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-surface p-5 overflow-y-auto">
        <div className="mb-8"><BrandMark /></div>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {nav.map((item) => {
            const active = current === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => navigate(item.screen)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition
                  ${active ? 'bg-red text-white' : 'text-muted hover:bg-surface-2 hover:text-navy'}`}
              >
                <Icon name={item.icon} size={20} />
                {item.label}
              </button>
            );
          })}
          {/* Messages — available to both roles */}
          <button
            onClick={() => navigate('messages')}
            aria-current={current === 'messages' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition
              ${current === 'messages' ? 'bg-red text-white' : 'text-muted hover:bg-surface-2 hover:text-navy'}`}
          >
            <Icon name="chat" size={20} />
            <span>Messages</span>
            <span className="ml-auto"><UnreadBadge count={state.unread} onDark={current === 'messages'} /></span>
          </button>
        </nav>
        <div className="mt-auto pt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-subtle font-semibold">Appearance</span>
            <ThemeToggle />
          </div>
          <InstallButton className="w-full" />
          <AccountBar />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-line bg-surface shrink-0">
          <BrandMark />
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate('messages')} aria-label="Messages" className="relative grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy hover:bg-surface-2 transition active:scale-95">
              <Icon name="chat" size={18} />
              {state.unread > 0 && <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-red text-white text-[10px] font-bold tnum">{state.unread > 99 ? '99+' : state.unread}</span>}
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8 py-5 pb-8">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex items-stretch border-t border-line bg-surface px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 shrink-0" aria-label="Primary">
          {nav.slice(0, 2).map((item) => (
            <TabButton key={item.screen} item={item} active={current === item.screen} onClick={() => navigate(item.screen)} />
          ))}
          <button
            onClick={() => navigate(fabTarget)}
            aria-label={state.role === 'worker' ? 'Find work' : 'Post a job'}
            className="flex-1 flex justify-center"
          >
            <span className="grid place-items-center w-[50px] h-[50px] -mt-6 rounded-2xl bg-red text-white shadow-e2">
              <Icon name="plus" size={26} />
            </span>
          </button>
          {nav.slice(2).map((item) => (
            <TabButton key={item.screen} item={item} active={current === item.screen} onClick={() => navigate(item.screen)} />
          ))}
        </nav>
      </div>
      </div>
    </div>
  );
}

function TabButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10.5px] font-bold transition
        ${active ? 'text-red' : 'text-subtle'}`}
    >
      <Icon name={item.icon} size={23} />
      {item.label}
    </button>
  );
}

export { BrandMark, AccountBar };
