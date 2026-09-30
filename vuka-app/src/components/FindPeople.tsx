import { useEffect, useId, useRef, useState } from 'react';
import { api, type PersonResult } from '../lib/api';
import { useApp } from '../store/appStore';
import { Avatar, Sheet, Skeleton } from './ui';
import { Icon } from './Icon';
import { useT } from '../providers/LanguageProvider';

/**
 * Find people to follow or message, by name.
 *
 * Following used to reach only someone you had met through a job, so nobody's
 * network could grow past the people they had worked with. The server searches
 * names only (never phone numbers) and leaves out anyone either side has
 * blocked. An empty box shows the newest members, which is how two people who
 * both just joined find each other.
 */
export function FindPeopleSheet({ onClose, onFollowChange }: { onClose: () => void; onFollowChange?: () => void }) {
  const { navigate } = useApp();
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonResult[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [shownFor, setShownFor] = useState(''); // the query the list on screen answers
  const inputId = useId();
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 1) return;
    const mine = ++seq.current;
    const timer = setTimeout(() => {
      api.searchUsers(q)
        .then((r) => { if (mine === seq.current) { setResults(r.results); setShownFor(q); setFailed(false); } })
        .catch(() => { if (mine === seq.current) { setResults([]); setShownFor(q); setFailed(true); } });
    }, q ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const setFollowing = (id: string, isFollowing: boolean) =>
    setResults((list) => list?.map((p) => (p.id === id ? { ...p, isFollowing } : p)) ?? list);

  const toggle = async (p: PersonResult) => {
    const next = !p.isFollowing;
    setFollowing(p.id, next); // optimistic
    try {
      const res = next ? await api.follow(p.id) : await api.unfollow(p.id);
      setFollowing(p.id, res.isFollowing);
      onFollowChange?.();
    } catch {
      setFollowing(p.id, !next);
    }
  };

  return (
    <Sheet title={t('common.people.find')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0">{t('common.people.find')}</h3>
      <p className="text-small text-dim mt-1 mb-3">{t('common.people.findIntro')}</p>

      <label htmlFor={inputId} className="sr-only">{t('common.people.searchLabel')}</label>
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none"><Icon name="search" size={18} /></span>
        <input
          id={inputId}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.people.searchPlaceholder')}
          className="w-full border-[1.5px] border-line rounded-pill pl-11 pr-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink"
        />
      </div>

      <div className="text-micro text-faint font-bold uppercase tracking-wide mb-2">{shownFor ? t('common.people.results') : t('common.people.newOnVuka')}</div>

      {results === null ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2"><Skeleton className="w-9 h-9 rounded-chip" /><Skeleton className="h-3.5 w-1/2" /></div>
        ))}</div>
      ) : results.length === 0 ? (
        <p className="text-small text-dim text-center py-8 m-0">
          {failed ? t('common.people.searchFailed')
            : shownFor ? t('common.people.noMatch', { query: shownFor }) : t('common.people.noneNew')}
        </p>
      ) : (
        <ul className="flex flex-col gap-1 list-none p-0 m-0">
          {results.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-2 rounded-chip">
              <button
                onClick={() => { onClose(); navigate('chat', p.id); }}
                className="flex items-center gap-3 flex-1 min-w-0 min-h-[44px] text-left"
                aria-label={t('common.people.messageName', { name: p.name })}
              >
                <Avatar initials={p.initials} size="sm" verified={p.idVerified} />
                <div className="flex-1 min-w-0">
                  <b className="text-small text-ink block truncate">{p.name}</b>
                  <span className="text-micro text-dim font-semibold block truncate">
                    {p.role === 'worker' ? t('common.people.worker') : t('common.people.employer')}{p.location ? ` · ${p.location}` : ''}{p.idVerified ? ` · ${t('common.trust.idVerified')}` : ''}
                  </span>
                </div>
              </button>
              <button
                onClick={() => void toggle(p)}
                aria-pressed={p.isFollowing}
                aria-label={p.isFollowing ? t('common.people.unfollowName', { name: p.name }) : t('common.people.followName', { name: p.name })}
                className={`shrink-0 inline-flex items-center gap-1 min-h-[36px] rounded-pill font-bold text-micro px-3 transition active:scale-95
                  ${p.isFollowing ? 'bg-surface-2 text-ink border border-line' : 'bg-ink text-canvas hover:opacity-90'}`}
              >
                {p.isFollowing ? <><Icon name="check" size={13} /> {t('common.people.following')}</> : <><Icon name="plus" size={13} /> {t('common.people.follow')}</>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
