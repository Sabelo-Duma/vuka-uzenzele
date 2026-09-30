import { useEffect, useId, useMemo, useState } from 'react';
import { api, type ChatUser } from '../lib/api';
import { useApp } from '../store/appStore';
import { Avatar, Card, Sheet, Skeleton, withSlot } from './ui';
import { Icon } from './Icon';
import { useT } from '../providers/LanguageProvider';
import { FindPeopleSheet } from './FindPeople';

/**
 * Follow / Following toggle for a given user, with a live follower count.
 * Optimistic: updates instantly and reconciles with the server response.
 */
export function FollowButton({ userId, showFollowers = true, className = '' }: { userId: string; showFollowers?: boolean; className?: string }) {
  const t = useT();
  const [state, setState] = useState<{ isFollowing: boolean; followers: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getSocial(userId)
      .then((s) => { if (!cancelled) setState({ isFollowing: s.isFollowing, followers: s.followers }); })
      .catch(() => { if (!cancelled) setState({ isFollowing: false, followers: 0 }); });
    return () => { cancelled = true; };
  }, [userId]);

  const toggle = async () => {
    if (!state || busy) return;
    setBusy(true);
    const next = !state.isFollowing;
    setState({ isFollowing: next, followers: Math.max(0, state.followers + (next ? 1 : -1)) }); // optimistic
    try {
      const res = next ? await api.follow(userId) : await api.unfollow(userId);
      setState({ isFollowing: res.isFollowing, followers: res.followers });
    } catch {
      setState({ isFollowing: !next, followers: Math.max(0, state.followers) }); // revert
    } finally {
      setBusy(false);
    }
  };

  const following = state?.isFollowing;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggle}
        disabled={!state || busy}
        aria-pressed={following}
        className={`inline-flex items-center justify-center gap-1.5 rounded-pill font-bold text-small px-4 py-2 transition active:scale-95 disabled:opacity-60
          ${following ? 'bg-surface-2 text-ink border border-line' : 'bg-ink text-canvas hover:opacity-90'}`}
      >
        {following ? <><Icon name="check" size={15} /> {t('common.people.following')}</> : <><Icon name="plus" size={15} /> {t('common.people.follow')}</>}
      </button>
      {showFollowers && state && (
        <span className="text-small text-dim">{withSlot(t('common.people.followers', { count: state.followers }), String(state.followers), <b className="text-ink font-mono tnum">{state.followers.toLocaleString()}</b>)}</span>
      )}
    </div>
  );
}

/**
 * Profile card: the accounts you follow, and the way to find more.
 *
 * The card stays a compact avatar stack at any size. Opening it used to expand
 * an inline 288px box holding every row at once — fine at five, unusable at
 * six hundred: every name in the DOM, a scroller the height of a thumb, and no
 * way to find anyone. The list is a proper sheet now, with a search field and
 * a page at a time, because at that size finding one person is the only thing
 * anyone is trying to do.
 */
const STACK = 8;
const PAGE = 25;

export function FollowingCard() {
  const t = useT();
  const [list, setList] = useState<ChatUser[] | null>(null);
  const [open, setOpen] = useState(false);

  const [finding, setFinding] = useState(false);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.listFollowing().then((l) => { if (!cancelled) setList(l); }).catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, [reloads]);

  /* Shown even when you follow nobody: that is when finding people matters. */
  const total = list?.length ?? 0;

  return (
    <Card className="p-4 mb-2.5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-small font-bold text-ink">
          {t('common.people.following')}{list ? <> · <span className="font-mono tnum">{total.toLocaleString('en-ZA')}</span></> : ''}
        </div>
        <div className="flex items-center gap-1">
          {total > 0 && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center min-h-[44px] px-2 rounded-chip text-small font-bold text-dim hover:bg-surface-2 transition"
            >
              {t('common.people.seeAll')}
            </button>
          )}
          <button
            onClick={() => setFinding(true)}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 -mr-2 rounded-chip text-small font-bold text-brand hover:bg-surface-2 transition"
          >
            <Icon name="search" size={15} /> {t('common.people.find')}
          </button>
        </div>
      </div>

      {list !== null && total === 0 ? (
        <p className="text-small text-dim leading-relaxed m-0">{t('common.people.followEmpty')}</p>
      ) : list === null ? (
        <div className="flex -space-x-2.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-9 h-9 rounded-full border-2 border-surface"><Skeleton className="w-full h-full rounded-full" /></span>)}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full text-left min-h-[44px]"
          aria-label={t('common.people.seeAllFollowing', { total })}
        >
          <div className="flex -space-x-2.5">
            {list.slice(0, STACK).map((u) => (
              <span key={u.id} title={u.name} className="grid place-items-center w-9 h-9 rounded-full bg-surface-3 text-ink text-small font-bold border-2 border-surface shadow-e1">{u.initials}</span>
            ))}
            {total > STACK && (
              <span className="grid place-items-center min-w-[2.25rem] h-9 px-1.5 rounded-full bg-surface-2 text-ink text-micro font-extrabold border-2 border-surface font-mono tnum">+{(total - STACK).toLocaleString('en-ZA')}</span>
            )}
          </div>
          {total <= 3 && <span className="text-small text-dim truncate">{list.map((u) => u.name.split(' ')[0]).join(', ')}</span>}
        </button>
      )}

      {open && list && <FollowingSheet list={list} onClose={() => setOpen(false)} />}
      {finding && <FindPeopleSheet onClose={() => setFinding(false)} onFollowChange={() => setReloads((n) => n + 1)} />}
    </Card>
  );
}

function FollowingSheet({ list, onClose }: { list: ChatUser[]; onClose: () => void }) {
  const { navigate } = useApp();
  const t = useT();
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const searchId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => u.name.toLowerCase().includes(q));
  }, [list, query]);

  const page = matches.slice(0, shown);
  const remaining = matches.length - page.length;

  return (
    <Sheet title={t('common.people.following')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0">{t('common.people.following')}</h3>
      <p className="text-small text-dim mt-1 mb-3">
        {withSlot(t('common.people.accountsTap', { count: list.length }), String(list.length), <span className="font-mono tnum">{list.length.toLocaleString('en-ZA')}</span>)}
      </p>

      {/* Search appears once there are enough people for scrolling to be the
          wrong way to find one. */}
      {list.length > PAGE && (
        <>
          <label htmlFor={searchId} className="sr-only">{t('common.people.searchFollowingLabel')}</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
            placeholder={t('common.people.searchByName')}
            className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink mb-3"
          />
        </>
      )}

      {matches.length === 0 ? (
        <p className="text-small text-dim text-center py-8 m-0">{t('common.people.noMatchFollowing', { query: query.trim() })}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {page.map((u) => (
              <button
                key={u.id}
                onClick={() => { onClose(); navigate('chat', u.id); }}
                className="flex items-center gap-3 p-2 min-h-[44px] rounded-chip hover:bg-surface-2 transition text-left"
              >
                <Avatar initials={u.initials} size="sm" />
                <div className="flex-1 min-w-0">
                  <b className="text-small text-ink block truncate">{u.name}</b>
                  <span className="text-micro text-dim font-semibold uppercase tracking-wide">{u.role === 'worker' ? t('common.people.worker') : u.role === 'employer' ? t('common.people.employer') : u.role}</span>
                </div>
                <span className="text-faint shrink-0"><Icon name="chat" size={18} /></span>
              </button>
            ))}
          </div>

          {remaining > 0 && (
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="w-full min-h-[44px] mt-3 rounded-pill border border-line text-ink text-small font-bold hover:bg-surface-2 transition active:scale-95"
            >
              {t('common.people.showMore', { shown: Math.min(PAGE, remaining).toLocaleString('en-ZA') })}
              <span className="text-dim font-semibold"> · {t('common.people.left', { left: remaining.toLocaleString('en-ZA') })}</span>
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
