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

/** Profile card: the accounts you follow. Hidden when you follow no one. Tap → chat. */
export function FollowingCard() {
  const { navigate } = useApp();
  const [list, setList] = useState<ChatUser[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.listFollowing().then((l) => { if (!cancelled) setList(l); }).catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  if (list && list.length === 0) return null;

  return (
    <Card className="p-4 mb-2.5">
      <div className="text-[13px] font-bold text-navy mb-2.5">Following{list ? ` · ${list.length}` : ''}</div>
      {list === null ? (
        <div className="flex flex-col gap-2">{[0, 1].map((i) => <Skeleton key={i} className="h-11 rounded-xl" />)}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
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
      )}
    </Card>
  );
}
