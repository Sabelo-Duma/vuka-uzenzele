import { useEffect, useId, useMemo, useState } from 'react';
import { api, type ChatUser } from '../lib/api';
import { useApp } from '../store/appStore';
import { Avatar, Card, Sheet, Skeleton } from './ui';
import { Icon } from './Icon';

/**
 * Follow / Following toggle for a given user, with a live follower count.
 * Optimistic: updates instantly and reconciles with the server response.
 */
export function FollowButton({ userId, showFollowers = true, className = '' }: { userId: string; showFollowers?: boolean; className?: string }) {
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
        {following ? <><Icon name="check" size={15} /> Following</> : <><Icon name="plus" size={15} /> Follow</>}
      </button>
      {showFollowers && state && (
        <span className="text-small text-dim"><b className="text-ink font-mono tnum">{state.followers.toLocaleString()}</b> follower{state.followers === 1 ? '' : 's'}</span>
      )}
    </div>
  );
}

/**
 * Profile card: the accounts you follow.
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
  const [list, setList] = useState<ChatUser[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.listFollowing().then((l) => { if (!cancelled) setList(l); }).catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  if (list && list.length === 0) return null;
  const total = list?.length ?? 0;

  return (
    <Card className="p-4 mb-2.5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-small font-bold text-ink">
          Following{list ? <> · <span className="font-mono tnum">{total.toLocaleString('en-ZA')}</span></> : ''}
        </div>
        {total > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center min-h-[44px] px-2 -mx-2 rounded-chip text-small font-bold text-brand hover:bg-surface-2 transition"
          >
            See all
          </button>
        )}
      </div>

      {list === null ? (
        <div className="flex -space-x-2.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-9 h-9 rounded-full border-2 border-surface"><Skeleton className="w-full h-full rounded-full" /></span>)}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full text-left min-h-[44px]"
          aria-label={`See all ${total} accounts you follow`}
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
    </Card>
  );
}

function FollowingSheet({ list, onClose }: { list: ChatUser[]; onClose: () => void }) {
  const { navigate } = useApp();
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
    <Sheet title="Following" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0">Following</h3>
      <p className="text-small text-dim mt-1 mb-3">
        <span className="font-mono tnum">{list.length.toLocaleString('en-ZA')}</span> {list.length === 1 ? 'account' : 'accounts'}. Tap anyone to message them.
      </p>

      {/* Search appears once there are enough people for scrolling to be the
          wrong way to find one. */}
      {list.length > PAGE && (
        <>
          <label htmlFor={searchId} className="sr-only">Search the people you follow</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
            placeholder="Search by name"
            className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink mb-3"
          />
        </>
      )}

      {matches.length === 0 ? (
        <p className="text-small text-dim text-center py-8 m-0">Nobody matches “{query.trim()}”.</p>
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
                  <span className="text-micro text-dim font-semibold uppercase tracking-wide">{u.role}</span>
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
              Show {Math.min(PAGE, remaining).toLocaleString('en-ZA')} more
              <span className="text-dim font-semibold"> · {remaining.toLocaleString('en-ZA')} left</span>
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
