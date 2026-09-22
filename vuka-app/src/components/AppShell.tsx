import { useCallback, type ReactNode } from 'react';
import { useApp, type Screen } from '../store/appStore';
import { useEdgeSwipeBack } from '../lib/useEdgeSwipeBack';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';
import { useT } from '../providers/LanguageProvider';
import { useTheme } from '../providers/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { InstallButton } from './InstallButton';
import { SunMark } from './SunMark';

interface NavItem { screen: Screen; labelKey: string; icon: IconName; }

/* One label per destination, used by both navs.
   The sidebar used to say "Jobs" and "Messages" where the tab bar said "Find
   work" and "Chats" — the same two screens under four names, in one app.
   These are catalogue keys, not words: the label is resolved at render so it
   follows the language the user chose. */
const WORKER_NAV: NavItem[] = [
  { screen: 'home', labelKey: 'nav.home', icon: 'home' },
  { screen: 'jobs', labelKey: 'nav.findWork', icon: 'jobs' },
  { screen: 'cv', labelKey: 'nav.myRecord', icon: 'ladder' },
  { screen: 'me', labelKey: 'nav.me', icon: 'user' },
];
const EMPLOYER_NAV: NavItem[] = [
  { screen: 'home', labelKey: 'nav.home', icon: 'home' },
  { screen: 'talent', labelKey: 'nav.talent', icon: 'talent' },
  { screen: 'post', labelKey: 'nav.post', icon: 'briefcase' },
  { screen: 'hires', labelKey: 'nav.myJobs', icon: 'jobs' },
  { screen: 'me', labelKey: 'nav.me', icon: 'user' },
];

const CHAT_TAB: NavItem = { screen: 'messages', labelKey: 'nav.chats', icon: 'chat' };

/**
 * Mobile keeps to four tabs plus the ＋ button, so each role drops the tab the
 * ＋ already covers and gains Chats. Employers reach Talent from Home.
 */
const MOBILE_TABS: Record<'worker' | 'employer', NavItem[]> = {
  worker: [
    { screen: 'home', labelKey: 'nav.home', icon: 'home' },
    CHAT_TAB,
    { screen: 'cv', labelKey: 'nav.myRecord', icon: 'ladder' },
    { screen: 'me', labelKey: 'nav.me', icon: 'user' },
  ],
  employer: [
    { screen: 'home', labelKey: 'nav.home', icon: 'home' },
    { screen: 'hires', labelKey: 'nav.myJobs', icon: 'jobs' },
    CHAT_TAB,
    { screen: 'me', labelKey: 'nav.me', icon: 'user' },
  ],
};

/** Which primary tab a (possibly detail) screen belongs to. */
function activeTab(screen: Screen): Screen {
  if (screen === 'gigDetail' || screen === 'formalDetail') return 'jobs';
  if (screen === 'workerDetail') return 'talent';
  if (screen === 'applicants') return 'hires';
  if (screen === 'chat') return 'messages';
  return screen;
}

/** Unread-count pill for the Messages entries. */
function UnreadBadge({ count, onDark }: { count: number; onDark?: boolean }) {
  if (count <= 0) return null;
  return (
    <span className={`grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-micro font-bold tnum ${onDark ? 'bg-brand-on text-brand' : 'bg-brand-solid text-brand-on'}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 font-bold text-ink min-w-0">
      <SunMark size={26} className="text-brand-solid" />
      {!compact && <span className="text-lead whitespace-nowrap">Vuka Uzenzele</span>}
    </div>
  );
}

function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const t = useT();
  return (
    <button
      onClick={toggle}
      aria-label={t(resolved === 'dark' ? 'nav.themeToggleToLight' : 'nav.themeToggleToDark')}
      className="grid place-items-center w-11 h-11 shrink-0 rounded-chip border border-line bg-surface text-ink hover:bg-surface-2 transition active:scale-95"
    >
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}

function AccountBar() {
  const { state, logout } = useApp();
  const t = useT();
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="text-micro text-faint uppercase tracking-wide font-bold">{t('nav.signedIn')}</div>
      <div className="text-small font-bold text-ink truncate">{state.user?.name ?? t('nav.you')}</div>
      <div className="text-micro text-dim mb-2">{t(state.role === 'worker' ? 'nav.accountWorker' : 'nav.accountEmployer')}</div>
      <button onClick={logout} className="w-full min-h-[44px] rounded-pill border border-line text-ink text-small font-bold py-2 hover:bg-surface transition active:scale-95">{t('nav.logOut')}</button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, navigate, goBack, canGoBack } = useApp();
  const t = useT();

  /* Swiping in from the left edge goes back, the way it does everywhere else
     on a phone. Only armed when there is somewhere to go: on a top-level tab
     the gesture should do nothing rather than something surprising. */
  const back = useCallback(() => goBack(), [goBack]);
  useEdgeSwipeBack(back, canGoBack);
  /* While the keyboard is up, the tab bar is in the way and nothing else.
     Neither viewport unit shrinks for a keyboard on any current browser, so
     without this the bar sits between the message box and the keys — which on
     a phone is most of the room you had left to read the conversation you are
     replying to. */
  const keyboardOpen = useKeyboardOpen();
  const nav = state.role === 'worker' ? WORKER_NAV : EMPLOYER_NAV;
  const current = activeTab(state.nav.screen);
  const fabTarget: Screen = state.role === 'worker' ? 'jobs' : 'post';
  const mobileTabs = MOBILE_TABS[state.role];
  /** Badge count for a tab: unread chats, or work waiting on the employer. */
  const badgeFor = (screen: Screen) =>
    screen === 'messages' ? state.unread : screen === 'hires' ? state.pendingConfirmations : 0;

  return (
    <div className="app-shell overflow-hidden bg-canvas text-ink">
      {/* Center the whole app (sidebar + content) on large screens so the
          sidebar sits next to the content instead of being stranded far-left.
          On desktop the shell is pinned to the viewport height so the sidebar
          stays put and only the content column scrolls. */}
      <div className="mx-auto flex h-full w-full max-w-[1440px] xl:border-x xl:border-line">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-surface p-5 overflow-y-auto">
        <div className="mb-8"><BrandMark /></div>
        <nav className="flex flex-col gap-1" aria-label={t('nav.primary')}>
          {nav.map((item) => {
            const active = current === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => navigate(item.screen)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-small font-bold transition
                  ${active ? 'bg-brand-solid text-brand-on' : 'text-dim hover:bg-surface-2 hover:text-ink'}`}
              >
                <Icon name={item.icon} size={20} />
                <span>{t(item.labelKey)}</span>
                {badgeFor(item.screen) > 0 && <span className="ml-auto"><UnreadBadge count={badgeFor(item.screen)} onDark={active} /></span>}
              </button>
            );
          })}
          {/* Chats — available to both roles */}
          <button
            onClick={() => navigate('messages')}
            aria-current={current === 'messages' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-small font-bold transition
              ${current === 'messages' ? 'bg-brand-solid text-brand-on' : 'text-dim hover:bg-surface-2 hover:text-ink'}`}
          >
            <Icon name="chat" size={20} />
            <span>{t(CHAT_TAB.labelKey)}</span>
            <span className="ml-auto"><UnreadBadge count={state.unread} onDark={current === 'messages'} /></span>
          </button>
          {/* Msizi — also both roles. Sits last because it is the thing you
              reach for when one of the others has not made sense. */}
          <button
            onClick={() => navigate('msizi')}
            aria-current={current === 'msizi' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-small font-bold transition
              ${current === 'msizi' ? 'bg-brand-solid text-brand-on' : 'text-dim hover:bg-surface-2 hover:text-ink'}`}
          >
            <Icon name="assistant" size={20} />
            <span>{t('msizi.open')}</span>
          </button>
        </nav>
        <div className="mt-auto pt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-micro text-faint font-semibold">Appearance</span>
            <ThemeToggle />
          </div>
          <InstallButton className="w-full" />
          <AccountBar />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        {/* The status bar overlays the page in an installed PWA (the manifest
            asks for a translucent one), so without this inset the top row sits
            underneath it and the theme toggle cannot be tapped at all. */}
        <header className="lg:hidden border-b border-line bg-surface shrink-0 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between gap-3 h-14
            pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))]">
            <BrandMark />
            <div className="flex items-center gap-2">
              {/* The mobile tab bar is four tabs plus the ＋ button, and every
                  one of those is a place you go to do something. Msizi is a
                  place you go when you are stuck, so it lives up here where it
                  is reachable from every screen without displacing any of
                  them. */}
              <button
                onClick={() => navigate('msizi')}
                aria-label={t('msizi.open')}
                aria-current={current === 'msizi' ? 'page' : undefined}
                className={`grid place-items-center w-11 h-11 shrink-0 rounded-chip border transition active:scale-95
                  ${current === 'msizi'
                    ? 'border-brand bg-brand-solid text-brand-on'
                    : 'border-line bg-surface text-ink hover:bg-surface-2'}`}
              >
                <Icon name="assistant" size={18} />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8 py-5 pb-8">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        {/* Pinned: it is a sibling of the scrolling <main>, not part of it.
            Taken out of the tree rather than hidden with a class, because
            `display: flex` beats the browser's own rule for [hidden] and the
            bar would simply stay. */}
        {!keyboardOpen && (
        <nav
          className="tabbar lg:hidden flex items-stretch border-t border-line bg-surface shrink-0
            pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]
            pl-[max(6px,env(safe-area-inset-left))] pr-[max(6px,env(safe-area-inset-right))]"
          aria-label={t('nav.primary')}
        >
          {mobileTabs.slice(0, 2).map((item) => (
            <TabButton key={item.screen} item={item} active={current === item.screen} badge={badgeFor(item.screen)} onClick={() => navigate(item.screen)} />
          ))}
          <button
            onClick={() => navigate(fabTarget)}
            aria-label={t(state.role === 'worker' ? 'nav.findWork' : 'post.title')}
            className="flex-1 flex justify-center"
          >
            <span className="fab grid place-items-center w-[52px] h-[52px] -mt-5 rounded-2xl bg-brand-solid text-brand-on shadow-e2 border-4 border-surface">
              <Icon name="plus" size={26} />
            </span>
          </button>
          {mobileTabs.slice(2).map((item) => (
            <TabButton key={item.screen} item={item} active={current === item.screen} badge={badgeFor(item.screen)} onClick={() => navigate(item.screen)} />
          ))}
        </nav>
        )}
      </div>
      </div>
    </div>
  );
}

function TabButton({ item, active, onClick, badge = 0 }: { item: NavItem; active: boolean; onClick: () => void; badge?: number }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-micro font-bold transition whitespace-nowrap
        ${active ? 'text-brand' : 'text-faint'}`}
    >
      <span className="relative">
        <Icon name={item.icon} size={23} />
        {badge > 0 && (
          <span
            className="absolute -top-1.5 -right-2 grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-brand-solid text-brand-on text-micro font-bold font-mono tnum"
            aria-label={t('nav.unreadMessages', { count: badge })}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {t(item.labelKey)}
    </button>
  );
}

export { BrandMark, AccountBar };
