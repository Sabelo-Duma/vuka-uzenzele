import { useEffect, useState } from 'react';
import { api, type ChatUser } from '../lib/api';
import { useApp } from '../store/appStore';
import { Avatar, Card, Skeleton } from './ui';
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
        className={`inline-flex items-center justify-center gap-1.5 rounded-pill font-bold text-[13px] px-4 py-2 transition active:scale-95 disabled:opacity-60
          ${following ? 'bg-surface-2 text-navy border border-line-strong' : 'bg-navy text-white dark:text-navy-deep hover:bg-navy-2'}`}
      >
        {following ? <><Icon name="check" size={15} /> Following</> : <><Icon name="plus" size={15} /> Follow</>}
      </button>
      {showFollowers && state && (
        <span className="text-[13px] text-muted"><b className="text-navy tnum">{state.followers}</b> follower{state.followers === 1 ? '' : 's'}</span>
      )}
    </div>
  );
}

/** Profile card: the accounts you follow. Compact avatar stack that scales to
 *  any number; "See all" expands to a scrollable list. Hidden when following no one. */
export function FollowingCard() {
  const { navigate } = useApp();
  const [list, setList] = useState<ChatUser[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const STACK = 8;

  useEffect(() => {
    let cancelled = false;
    api.listFollowing().then((l) => { if (!cancelled) setList(l); }).catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  if (list && list.length === 0) return null;

  return (
    <Card className="p-4 mb-2.5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-bold text-navy">Following{list ? ` · ${list.length}` : ''}</div>
        {list && list.length > 0 && (
          <button onClick={() => setExpanded((v) => !v)} className="text-[12px] font-bold text-red">{expanded ? 'Show less' : 'See all'}</button>
        )}
      </div>

      {list === null ? (
        <div className="flex -space-x-2.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-9 h-9 rounded-full border-2 border-surface"><Skeleton className="w-full h-full rounded-full" /></span>)}</div>
      ) : expanded ? (
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto scroll-area -mx-1 px-1">
          {list.map((u) => (
            <button key={u.id} onClick={() => navigate('chat', u.id)} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-2 transition text-left">
              <Avatar initials={u.initials} color={u.color} size="sm" />
              <div className="flex-1 min-w-0">
                <b className="text-sm text-navy block truncate">{u.name}</b>
                <span className="text-[11px] text-muted font-semibold uppercase tracking-wide">{u.role}</span>
              </div>
              <span className="text-subtle"><Icon name="chat" size={16} /></span>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setExpanded(true)} className="flex items-center gap-3 w-full text-left" aria-label={`See all ${list.length} you follow`}>
          <div className="flex -space-x-2.5">
            {list.slice(0, STACK).map((u) => (
              <span key={u.id} title={u.name} className="grid place-items-center w-9 h-9 rounded-full text-white text-[12px] font-bold border-2 border-surface shadow-e1" style={{ background: u.color }}>{u.initials}</span>
            ))}
            {list.length > STACK && (
              <span className="grid place-items-center w-9 h-9 rounded-full bg-surface-2 text-navy text-[11px] font-extrabold border-2 border-surface tnum">+{list.length - STACK}</span>
            )}
          </div>
          {list.length <= 3 && <span className="text-[12.5px] text-muted truncate">{list.map((u) => u.name.split(' ')[0]).join(', ')}</span>}
        </button>
      )}
    </Card>
  );
}
